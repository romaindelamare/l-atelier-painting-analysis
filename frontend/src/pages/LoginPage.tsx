import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 md:px-10 py-8">
      <section className="rise">
        <h1 className="font-display text-5xl md:text-6xl font-medium leading-tight text-ink mb-12">
          Sign in to the <span className="italic text-accent">atelier</span>.
        </h1>

        <form onSubmit={handleSubmit} className="mt-8">
          <label className="block">
            <span className="eyebrow">Password</span>
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-display text-xl text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none"
            />
          </label>

          {error && (
            <p className="mt-4 text-sm text-accent border-l-2 border-accent pl-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className={[
              "mt-8 w-full py-4 eyebrow !text-paper transition-all duration-300",
              submitting || !password
                ? "bg-ink/30 cursor-not-allowed"
                : "bg-ink hover:bg-accent",
            ].join(" ")}
          >
            {submitting ? "Unlocking…" : "Enter the studio"}
          </button>
        </form>
      </section>
    </div>
  );
}
