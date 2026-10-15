# Quiz upgrade: XP, leaderboard, adaptive learning

Large spec, so it ships in 3 phases. Each phase works on its own. Everything uses real stored data. Until enough players exist, the app shows honest empty states, never made-up numbers.

## Phase 1: Real scoring foundation
- Store a shared question bank in the database. Each question carries its region, skill category (indirectness, politeness, hierarchy, disagreement, workplace, academic, nonverbal), difficulty, and source (regional or personalised).
- Seed region questions for Japan, China, US, UK, France, Spain, Korea and Germany. Each one is a realistic scenario with hedged explanations, not trivia or stereotypes. Generated with the AI and reviewed against the safety rules.
- Signed-in quiz: 20 questions, about 5 personalised and 15 regional. Personalised ones are built privately from the user's own saved analyses, with identifying details removed. Only the owner can see them.
- The server checks every answer and awards XP:
  - +100 for a correct answer
  - 2x from the third correct answer in a row
  - +50 for a difficult question
  - +100 for finishing a quiz
  - +50 for getting a previously missed concept right
- XP is only given on a player's first attempt at each question, which stops farming.
- After each answer: correct or not, XP earned, the explanation, and a rarity card. The card shows "X% of N players got this right", using each player's first attempt. Below 30 players it shows "Not enough player data yet". Personalised questions never show a rarity card.
- Region preferences: pick one or more regions, editable on the Account page.
- The existing quick quiz from saved scenarios stays as it is. It still works signed out.

## Phase 2: Leaderboard
- New Leaderboard tab with Global or region filters, plus Weekly or All-time.
- Shows the top players' public name, level and XP. The player's own row stays highlighted with rank, percentile and movement, even when they are outside the top list.
- On Account, players can set a public display name or opt out of rankings.

## Phase 3: Cultural Intelligence Dashboard and achievements
- Shows:
  - Accuracy overall, by region and by skill
  - Progress over time
  - Strongest and weakest skills
  - Concepts that were missed and later mastered
- XP is shown separately from demonstrated understanding.
- Recurring mistakes are tracked per concept. They resurface with differently worded scenarios in later sessions.
- Achievements: Cultural Explorer, Context Detective, Bridge Builder, Cultural Interpreter.
- XP animations and rank progression indicators.
- All new text is translated into the five languages.

## Technical details
- New tables:
  - `user_preferences`: regions, public name, opt-out
  - `quiz_questions`: shared, `owner_id` null; personalised rows have the owner set
  - `quiz_sessions`
  - `quiz_attempts`: unique per user and question on the first attempt
  - `xp_events`
  - `concept_mastery`
- RLS: users only see their own rows. Shared questions are readable by signed-in users.
- Correct answers are never sent to the client before the player answers.
- Scoring, rarity and leaderboard aggregation run in server functions with `requireSupabaseAuth`, plus a SECURITY DEFINER SQL function for aggregated stats. That function only returns counts and opted-in public names.
- The rarity threshold (30) and XP values live in one server constant.
