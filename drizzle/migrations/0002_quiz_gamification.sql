CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY,
  regions text[] NOT NULL DEFAULT '{}',
  public_name text,
  leaderboard_opt_out boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs read" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  source text NOT NULL DEFAULT 'regional' CHECK (source IN ('regional','personal')),
  region text NOT NULL,
  category text NOT NULL,
  difficulty smallint NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
  concept text NOT NULL,
  scenario text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_id text NOT NULL,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_questions_region_idx ON public.quiz_questions(region) WHERE owner_id IS NULL;
CREATE INDEX quiz_questions_owner_idx ON public.quiz_questions(owner_id);
GRANT SELECT (id, owner_id, source, region, category, difficulty, concept, scenario, question, options, created_at) ON public.quiz_questions TO authenticated;
GRANT INSERT ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read shared or own questions" ON public.quiz_questions FOR SELECT TO authenticated USING (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "insert own personal questions" ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND source = 'personal');

CREATE TABLE public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  regions text[] NOT NULL DEFAULT '{}',
  question_ids uuid[] NOT NULL DEFAULT '{}',
  streak int NOT NULL DEFAULT 0,
  xp int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_sessions TO authenticated;
GRANT ALL ON public.quiz_sessions TO service_role;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.quiz_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  chosen_id text NOT NULL,
  correct boolean NOT NULL,
  is_first boolean NOT NULL,
  xp int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);
CREATE UNIQUE INDEX quiz_attempts_first_idx ON public.quiz_attempts(user_id, question_id) WHERE is_first;
CREATE INDEX quiz_attempts_q_idx ON public.quiz_attempts(question_id) WHERE is_first;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount int NOT NULL,
  reason text NOT NULL,
  region text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX xp_events_user_idx ON public.xp_events(user_id, created_at);
GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp" ON public.xp_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.concept_mastery (
  user_id uuid NOT NULL,
  concept text NOT NULL,
  region text NOT NULL,
  category text NOT NULL,
  hits int NOT NULL DEFAULT 0,
  misses int NOT NULL DEFAULT 0,
  last_correct boolean,
  mastered_after_miss boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, concept)
);
GRANT SELECT ON public.concept_mastery TO authenticated;
GRANT ALL ON public.concept_mastery TO service_role;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mastery" ON public.concept_mastery FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Start a session: ~25% personal, rest regional, prioritising missed concepts and unseen questions.
CREATE OR REPLACE FUNCTION public.start_quiz(_regions text[], _size int DEFAULT 20)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); n int := LEAST(GREATEST(_size, 3), 20); personal uuid[]; regional uuid[]; sid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT coalesce(array_agg(id), '{}') INTO personal FROM (
    SELECT q.id FROM quiz_questions q
    LEFT JOIN concept_mastery m ON m.user_id = uid AND m.concept = q.concept
    WHERE q.owner_id = uid
    ORDER BY (coalesce(m.last_correct, true) = false) DESC,
             EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.user_id = uid AND a.question_id = q.id), random()
    LIMIT round(n * 0.25)::int) s;
  SELECT coalesce(array_agg(id), '{}') INTO regional FROM (
    SELECT q.id FROM quiz_questions q
    LEFT JOIN concept_mastery m ON m.user_id = uid AND m.concept = q.concept
    WHERE q.owner_id IS NULL AND (cardinality(coalesce(_regions,'{}')) = 0 OR q.region = ANY(_regions))
    ORDER BY (coalesce(m.last_correct, true) = false) DESC,
             EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.user_id = uid AND a.question_id = q.id), random()
    LIMIT n - cardinality(personal)) s;
  INSERT INTO quiz_sessions(user_id, regions, question_ids)
  VALUES (uid, coalesce(_regions,'{}'), (SELECT coalesce(array_agg(x ORDER BY random()), '{}') FROM unnest(personal || regional) x))
  RETURNING id INTO sid;
  RETURN sid;
END $$;

CREATE OR REPLACE FUNCTION public.submit_answer(_session uuid, _question uuid, _choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); s quiz_sessions; q quiz_questions; m concept_mastery;
  ok boolean; first boolean; new_streak int; gained int := 0; improved boolean := false;
  attempted int; right_n int; rarity jsonb := NULL;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT * INTO s FROM quiz_sessions WHERE id = _session AND user_id = uid FOR UPDATE;
  IF NOT FOUND OR s.completed_at IS NOT NULL THEN RAISE EXCEPTION 'invalid session'; END IF;
  IF NOT (_question = ANY(s.question_ids)) THEN RAISE EXCEPTION 'question not in session'; END IF;
  IF EXISTS (SELECT 1 FROM quiz_attempts WHERE session_id = _session AND question_id = _question) THEN RAISE EXCEPTION 'already answered'; END IF;
  SELECT * INTO q FROM quiz_questions WHERE id = _question AND (owner_id IS NULL OR owner_id = uid);
  IF NOT FOUND THEN RAISE EXCEPTION 'question not found'; END IF;

  ok := (_choice = q.correct_id);
  first := NOT EXISTS (SELECT 1 FROM quiz_attempts WHERE user_id = uid AND question_id = _question AND is_first);
  new_streak := CASE WHEN ok THEN s.streak + 1 ELSE 0 END;
  SELECT * INTO m FROM concept_mastery WHERE user_id = uid AND concept = q.concept;

  IF ok AND first THEN
    gained := CASE WHEN new_streak >= 3 THEN 200 ELSE 100 END;
    IF q.difficulty = 3 THEN gained := gained + 50; END IF;
    IF m.misses > 0 AND m.last_correct = false THEN gained := gained + 50; improved := true; END IF;
  END IF;

  INSERT INTO quiz_attempts(user_id, session_id, question_id, chosen_id, correct, is_first, xp)
  VALUES (uid, _session, _question, _choice, ok, first, gained);
  IF gained > 0 THEN INSERT INTO xp_events(user_id, amount, reason, region) VALUES (uid, gained, 'answer', q.region); END IF;
  UPDATE quiz_sessions SET streak = new_streak, xp = xp + gained WHERE id = _session;

  INSERT INTO concept_mastery(user_id, concept, region, category, hits, misses, last_correct, mastered_after_miss)
  VALUES (uid, q.concept, q.region, q.category, CASE WHEN ok THEN 1 ELSE 0 END, CASE WHEN ok THEN 0 ELSE 1 END, ok, false)
  ON CONFLICT (user_id, concept) DO UPDATE SET
    hits = concept_mastery.hits + CASE WHEN ok THEN 1 ELSE 0 END,
    misses = concept_mastery.misses + CASE WHEN ok THEN 0 ELSE 1 END,
    mastered_after_miss = concept_mastery.mastered_after_miss OR (ok AND concept_mastery.misses > 0),
    last_correct = ok, updated_at = now();

  IF q.owner_id IS NULL THEN
    SELECT count(*), count(*) FILTER (WHERE correct) INTO attempted, right_n
      FROM quiz_attempts WHERE question_id = _question AND is_first;
    rarity := jsonb_build_object('attempts', attempted,
      'percent', CASE WHEN attempted >= 30 THEN round(100.0 * right_n / attempted) ELSE NULL END);
  END IF;

  RETURN jsonb_build_object('correct', ok, 'correctId', q.correct_id, 'xp', gained, 'streak', new_streak,
    'firstAttempt', first, 'improved', improved, 'explanation', q.explanation,
    'feedback', coalesce(q.feedback ->> _choice, ''), 'rarity', rarity);
END $$;

CREATE OR REPLACE FUNCTION public.complete_quiz(_session uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); s quiz_sessions; answered int; bonus int := 0;
BEGIN
  SELECT * INTO s FROM quiz_sessions WHERE id = _session AND user_id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid session'; END IF;
  IF s.completed_at IS NULL THEN
    SELECT count(*) INTO answered FROM quiz_attempts WHERE session_id = _session;
    IF answered = cardinality(s.question_ids) AND answered > 0 THEN
      bonus := 100;
      INSERT INTO xp_events(user_id, amount, reason) VALUES (uid, bonus, 'quiz_complete');
    END IF;
    UPDATE quiz_sessions SET completed_at = now(), xp = xp + bonus WHERE id = _session RETURNING * INTO s;
  END IF;
  RETURN jsonb_build_object('bonus', bonus, 'sessionXp', s.xp);
END $$;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_region text, _period text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); since timestamptz := CASE WHEN _period = 'week' THEN now() - interval '7 days' ELSE '-infinity'::timestamptz END;
  top jsonb; me jsonb; total int; prev_rank int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  WITH scores AS (
    SELECT e.user_id, sum(e.amount)::int AS xp,
      (SELECT sum(amount) FROM xp_events t WHERE t.user_id = e.user_id)::int AS lifetime
    FROM xp_events e LEFT JOIN user_preferences p ON p.user_id = e.user_id
    WHERE e.created_at >= since AND (_region IS NULL OR e.region = _region) AND coalesce(p.leaderboard_opt_out, false) = false
    GROUP BY e.user_id),
  ranked AS (SELECT s.*, rank() OVER (ORDER BY xp DESC) AS rnk, count(*) OVER () AS n FROM scores s)
  SELECT
    coalesce((SELECT jsonb_agg(jsonb_build_object('rank', r.rnk, 'name', coalesce(nullif(p.public_name,''), nullif(pr.display_name,''), 'Player'),
      'xp', r.xp, 'level', r.lifetime / 1000 + 1, 'isMe', r.user_id = uid) ORDER BY r.rnk)
      FROM (SELECT * FROM ranked ORDER BY rnk LIMIT 20) r
      LEFT JOIN user_preferences p ON p.user_id = r.user_id LEFT JOIN profiles pr ON pr.id = r.user_id), '[]'::jsonb),
    (SELECT jsonb_build_object('rank', rnk, 'xp', xp, 'level', lifetime / 1000 + 1,
       'percentile', CASE WHEN n > 0 THEN round(100.0 * (n - rnk + 1) / n) ELSE NULL END) FROM ranked WHERE user_id = uid),
    (SELECT count(*) FROM scores)
  INTO top, me, total;

  IF _period <> 'week' AND me IS NOT NULL THEN
    SELECT rnk INTO prev_rank FROM (
      SELECT e.user_id, rank() OVER (ORDER BY sum(e.amount) DESC) AS rnk
      FROM xp_events e LEFT JOIN user_preferences p ON p.user_id = e.user_id
      WHERE e.created_at < now() - interval '7 days' AND (_region IS NULL OR e.region = _region) AND coalesce(p.leaderboard_opt_out,false) = false
      GROUP BY e.user_id) x WHERE user_id = uid;
    IF prev_rank IS NOT NULL THEN me := me || jsonb_build_object('movement', prev_rank - (me->>'rank')::int); END IF;
  END IF;
  RETURN jsonb_build_object('top', top, 'me', me, 'total', total);
END $$;

REVOKE ALL ON FUNCTION public.start_quiz(text[], int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_answer(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_quiz(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_leaderboard(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_quiz(text[], int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_quiz(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, text) TO authenticated;