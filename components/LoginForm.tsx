"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      router.push(body.redirect ?? "/");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Invalid credentials.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="alert alert-error">{error}</div>}
      <div>
        <label className="mb-2 block" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </div>
      <div>
        <label className="mb-2 block" htmlFor="password">Password</label>
        <input id="password" type="password" className="input" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </div>
      <button type="submit" className="btn btn-md btn-primary w-full" disabled={busy}>
        {busy ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
