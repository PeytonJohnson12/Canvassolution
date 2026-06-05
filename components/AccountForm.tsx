"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Initial {
  fullName: string;
  email: string;
  phone: string;
}

export function AccountForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...initial, password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setSaved(false);
    const payload: Record<string, string> = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
    };
    if (form.password) payload.password = form.password;

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      setForm((f) => ({ ...f, password: "" }));
      router.refresh(); // update sidebar name/email
    } else {
      const body = await res.json().catch(() => ({}));
      setErrors(body.errors ?? {});
    }
  }

  return (
    <div>
      <h1>Account</h1>
      <p className="mt-1">Your local profile.</p>

      <form onSubmit={onSubmit} className="card card-default mt-6 max-w-xl space-y-4 p-6">
        <div>
          <label className="mb-2 block" htmlFor="fullName">Full name</label>
          <input id="fullName" className="input" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          {errors.fullName && <p className="error-text">{errors.fullName}</p>}
        </div>
        <div>
          <label className="mb-2 block" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>
        <div>
          <label className="mb-2 block" htmlFor="phone">Phone <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
          <input id="phone" className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block" htmlFor="password">New password <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(leave blank to keep)</span></label>
          <input id="password" type="password" className="input" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-md btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm" style={{ color: "var(--success)" }}>Saved.</span>}
        </div>
      </form>
    </div>
  );
}
