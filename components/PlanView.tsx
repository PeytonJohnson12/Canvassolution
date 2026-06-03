"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PlanPayload } from "@/lib/plan";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDayLabel(dateStr: string, weekday: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${weekday} · ${MONTHS[m - 1]} ${d}`;
}

function fmtSynced(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function fmtDue(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function PlanView({ initial }: { initial: PlanPayload }) {
  const [payload, setPayload] = useState<PlanPayload>(initial);
  const [hours, setHours] = useState<string>(String(initial.hours));
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const didAutoSync = useRef(false);

  // FR-6: sync automatically once per browser session (≈ on login).
  useEffect(() => {
    if (!payload.connected || didAutoSync.current) return;
    didAutoSync.current = true;
    if (typeof window !== "undefined" && sessionStorage.getItem("sp_autosynced")) return;
    sessionStorage.setItem("sp_autosynced", "1");
    void runSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reloadPlan(h?: string) {
    const q = h ? `?hours=${encodeURIComponent(h)}` : "";
    const res = await fetch(`/api/plan${q}`);
    if (res.ok) setPayload(await res.json());
  }

  async function runSync() {
    setSyncing(true);
    setNotice(null);
    const res = await fetch("/api/sync", { method: "POST" });
    const result = await res.json().catch(() => ({}));
    setSyncing(false);
    setWarnings(result.failedCourses ?? []);
    if (result.ok) {
      setNotice({ kind: result.failedCourses?.length ? "warn" : "ok", text: result.message });
    } else {
      setNotice({ kind: "error", text: result.message ?? "Sync failed." });
    }
    await reloadPlan(hours);
  }

  async function applyHours(e: React.FormEvent) {
    e.preventDefault();
    const h = Number(hours);
    if (!(h > 0 && h <= 24)) {
      setNotice({ kind: "error", text: "Hours must be greater than 0 and at most 24." });
      return;
    }
    setNotice(null);
    await reloadPlan(hours);
  }

  const { plan } = payload;
  const statusPill = !payload.connected
    ? { text: "Not connected", cls: "bg-gray-100 text-gray-600" }
    : payload.stale
    ? { text: "Stale data", cls: "bg-amber-100 text-amber-800" }
    : { text: "Up to date", cls: "bg-emerald-100 text-emerald-700" };

  const hasAssignments =
    plan.days.some((d) => d.blocks.length > 0) || plan.atRisk.length > 0 || plan.undated.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your plan</h1>
          <p className="mt-1 text-sm text-muted">
            {plan.windowStart} → {plan.windowEnd} · {plan.days.length} days
            <span className={`ml-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill.cls}`}>
              {statusPill.text}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Last synced: {fmtSynced(payload.syncedAt)}
            {payload.accountName ? ` · ${payload.accountName}` : ""}
          </p>
        </div>
        <button onClick={runSync} className="btn-ghost" disabled={syncing || !payload.connected}>
          {syncing ? "Syncing…" : "Refresh"}
        </button>
      </div>

      {/* Notices */}
      {notice && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            notice.kind === "ok"
              ? "bg-emerald-50 text-emerald-800"
              : notice.kind === "warn"
              ? "bg-amber-50 text-amber-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
          {warnings.length > 0 && <span className="block text-xs opacity-80">Failed: {warnings.join(", ")}</span>}
        </div>
      )}

      {!payload.connected && (
        <div className="card mt-6 p-6">
          <p className="text-sm text-ink">Connect your Canvas account to build a plan.</p>
          <Link href="/connections" className="btn-primary mt-3">Connect Canvas</Link>
        </div>
      )}

      {payload.connected && (
        <>
          {/* Hours + summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr]">
            <form onSubmit={applyHours} className="card flex items-end gap-3 p-4">
              <div>
                <label className="label" htmlFor="hours">Hours / day</label>
                <input
                  id="hours" type="number" min="0.5" max="24" step="0.5"
                  className="field w-28" value={hours} onChange={(e) => setHours(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary">Apply</button>
            </form>
            <div className="card grid grid-cols-3 divide-x divide-gray-100 p-4 text-center">
              <Stat label="Due in window" value={plan.inWindowDueCount} />
              <Stat label="At risk" value={plan.atRisk.filter((a) => a.kind === "insufficient_time").length} accent={plan.atRisk.length > 0} />
              <Stat label="Planned hrs" value={plan.totalPlannedHours} />
            </div>
          </div>

          {/* Empty state (FR-7.4) */}
          {!hasAssignments && (
            <div className="card mt-6 p-8 text-center">
              <p className="text-sm font-medium text-ink">No assignments to plan yet.</p>
              <p className="mt-1 text-sm text-muted">
                {payload.stale
                  ? "We couldn't reach Canvas and there's nothing cached. Try Refresh once Canvas is back."
                  : "Hit Refresh to pull your latest Canvas coursework."}
              </p>
            </div>
          )}

          {/* AT_RISK */}
          {plan.atRisk.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600">Needs attention</h2>
              <div className="mt-3 space-y-2">
                {plan.atRisk.map((a) => (
                  <div key={`risk-${a.canvasId}`} className="card flex items-center justify-between border-red-100 bg-red-50/40 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {a.htmlUrl ? <a href={a.htmlUrl} target="_blank" rel="noreferrer" className="hover:text-accent">{a.name}</a> : a.name}
                      </p>
                      <p className="truncate text-xs text-muted">{a.courseName} · due {fmtDue(a.dueAt)}</p>
                    </div>
                    <span className="ml-3 shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      {a.kind === "overdue" ? "Past due" : `+${a.shortfallHours}h won't fit`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Day cards */}
          {hasAssignments && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Daily plan</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {plan.days.map((day) => {
                  const pct = day.capacity > 0 ? Math.min(100, (day.allocated / day.capacity) * 100) : 0;
                  return (
                    <div key={day.date} className={`card p-4 ${day.isToday ? "ring-2 ring-accent-ring" : ""}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink">
                          {fmtDayLabel(day.date, day.weekday)} {day.isToday && <span className="text-accent">· Today</span>}
                        </p>
                        <span className="text-xs text-muted">{day.allocated}/{day.capacity}h</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-3 space-y-2">
                        {day.blocks.length === 0 && <p className="text-xs text-muted">No work scheduled.</p>}
                        {day.blocks.map((b, i) => (
                          <div key={`${day.date}-${b.canvasId}-${i}`} className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                              {b.hours}h
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm text-ink">
                                {b.htmlUrl ? <a href={b.htmlUrl} target="_blank" rel="noreferrer" className="hover:text-accent">{b.name}</a> : b.name}
                              </p>
                              <p className="truncate text-xs text-muted">{b.courseName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Undated */}
          {plan.undated.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">No due date</h2>
              <div className="mt-3 space-y-2">
                {plan.undated.map((u) => (
                  <div key={`und-${u.canvasId}`} className="card flex items-center justify-between p-3.5">
                    <p className="truncate text-sm text-ink">
                      {u.htmlUrl ? <a href={u.htmlUrl} target="_blank" rel="noreferrer" className="hover:text-accent">{u.name}</a> : u.name}
                    </p>
                    <span className="ml-3 shrink-0 text-xs text-muted">{u.courseName}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="px-2">
      <p className={`text-2xl font-semibold ${accent ? "text-red-600" : "text-ink"}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
