"use client";

import { useState } from "react";
import Link from "next/link";

interface Initial {
  host: string;
  hasToken: boolean;
  status: string | null;
  accountName: string | null;
}

const STATUS_PILL: Record<string, { text: string; cls: string }> = {
  valid: { text: "Connected", cls: "badge-success" },
  invalid_token: { text: "Token rejected", cls: "badge-destructive" },
  bad_domain: { text: "Bad domain", cls: "badge-destructive" },
  unreachable: { text: "Unreachable", cls: "badge-warning" },
  insufficient_scope: { text: "Insufficient scope", cls: "badge-warning" },
  error: { text: "Error", cls: "badge-destructive" },
};

export function ConnectionsForm({ initial }: { initial: Initial }) {
  const [host, setHost] = useState(initial.host);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(initial.status);
  const [accountName, setAccountName] = useState<string | null>(initial.accountName);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/canvas/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, token }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (body.error) {
      setMessage(body.error);
      return;
    }
    setStatus(body.status);
    setAccountName(body.accountName ?? null);
    setMessage(body.message);
  }

  const pill = status ? STATUS_PILL[status] : null;
  const connected = status === "valid";

  return (
    <div>
      <h1>Connections</h1>
      <p className="mt-1">Link the Canvas account StudyPlan reads your coursework from.</p>

      <div className="card card-default mt-6 max-w-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Canvas</span>
          {pill && (
            <span className={`badge ${pill.cls}`}>
              {pill.text}
              {connected && accountName ? ` · ${accountName}` : ""}
            </span>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block" htmlFor="host">Canvas domain</label>
            <input id="host" className="input" placeholder="school.instructure.com"
              value={host} onChange={(e) => setHost(e.target.value)} required />
            <p className="hint">Just the host — we add https:// and /api/v1.</p>
          </div>
          <div>
            <label className="mb-2 block" htmlFor="token">Personal access token</label>
            <input id="token" type="password" className="input"
              placeholder={initial.hasToken ? "•••••••• (re-enter to update)" : "Paste your Canvas token"}
              value={token} onChange={(e) => setToken(e.target.value)} required />
            <p className="hint">Stored locally in plaintext on your machine.</p>
          </div>

          <details className="card card-bordered" style={{ padding: "var(--space-12) var(--space-16)" }}>
            <summary style={{ cursor: "pointer", color: "var(--text-primary)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
              How do I get a token?
            </summary>
            <ol className="mt-2" style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", paddingLeft: "1.1rem", lineHeight: 1.7 }}>
              <li>In Canvas, click <strong>Account → Settings</strong>.</li>
              <li>Scroll to <strong>Approved Integrations</strong> → <strong>+ New Access Token</strong>.</li>
              <li>Give it a purpose (e.g. "StudyPlan") and leave the expiry blank, then <strong>Generate Token</strong>.</li>
              <li>Copy the token and paste it above. (Canvas only shows it once.)</li>
            </ol>
          </details>

          <button type="submit" className="btn btn-md btn-primary" disabled={busy}>
            {busy ? "Validating…" : connected ? "Update connection" : "Save & validate"}
          </button>
        </form>

        {message && (
          <div className={`alert mt-4 ${connected ? "alert-success" : "alert-error"}`}>
            <div>
              {connected && accountName ? `Connected as ${accountName}. ` : ""}{message}
            </div>
          </div>
        )}

        {connected && (
          <Link href="/" className="btn btn-md btn-primary mt-4">View your plan →</Link>
        )}
      </div>
    </div>
  );
}
