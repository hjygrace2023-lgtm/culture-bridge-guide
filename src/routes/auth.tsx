import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeading } from "@/components/layout/page-heading";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/lib/auth/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CultureLens" },
      { name: "description", content: "Optional account for keeping your analyses and drafts across devices." },
      { property: "og:title", content: "Sign in — CultureLens" },
      { property: "og:description", content: "Signing in is optional; CultureLens works fully without an account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/account", replace: true });
  }, [loading, session, navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Check your email to confirm the account, then come back and sign in.");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
      navigate({ to: "/account", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setError(result.error.message);
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-8 sm:px-8">
      <PageHeading
        eyebrow="Optional"
        title={
          <>
            Sign
            <br />
            In
          </>
        }
        lede="Keep your history across devices."
      />

      <div className="mt-5 flex border-2 border-foreground">
        {(["in", "up"] as const).map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
              i > 0 ? "border-l-2 border-foreground" : ""
            } ${mode === m ? "bg-foreground text-background" : "hover:bg-yellow"}`}
          >
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.08em]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.08em]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>

        {error && (
          <p role="alert" className="border-2 border-destructive/40 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        {message && <p className="border-2 border-foreground bg-yellow px-3 py-2 text-xs">{message}</p>}

        <Button type="submit" size="lg" variant="accent" disabled={busy} className="w-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <Button type="button" variant="outline" size="lg" onClick={onGoogle} className="mt-3 w-full">
        Continue with Google
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">
        <Link to="/" className="underline underline-offset-4">
          Continue without an account →
        </Link>
      </p>
    </div>
  );
}
