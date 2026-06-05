"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PlanPayload } from "@/lib/plan";
import type { PlanDay } from "@/lib/scheduler";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// V3 — soft, distinct per-course colors (deterministic by name).
const COURSE_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];
function courseColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COURSE_COLORS[h % COURSE_COLORS.length];
}

// V4 — small inline glyphs.
const ICON = {
  sun: "M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6 19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4 19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  calendar: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  alert: "M12 9v4M12 17h.01M10.3 4.3 2.7 18a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 4.3a1.5 1.5 0 0 0-2.6 0Z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  list: "M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  inbox: "M3 12h5l2 3h4l2-3h5M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
};

function Glyph({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmtDayLabel(dateStr: string, weekday: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${weekday} · ${MONTHS[m - 1]} ${d}`;
}
function fmtSynced(iso: string | null) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtDue(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function PlanView({ initial, userName }: { initial: PlanPayload; userName: string }) {
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

  // V6 — auto-dismiss non-error toasts.
  useEffect(() => {
    if (notice && notice.kind !== "error") {
      const t = setTimeout(() => setNotice(null), 3500);
      return () => clearTimeout(t);
    }
  }, [notice]);

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
    if (result.ok) setNotice({ kind: result.failedCourses?.length ? "warn" : "ok", text: result.message });
    else setNotice({ kind: "error", text: result.message ?? "Sync failed." });
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
  const firstName = userName.trim().split(/\s+/)[0] || "there";
  const todayLong = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const statusPill = !payload.connected
    ? { text: "Not connected", cls: "badge-default" }
    : payload.stale
    ? { text: "Stale data", cls: "badge-warning" }
    : { text: "Up to date", cls: "badge-success" };

  const atRiskCount = plan.atRisk.filter((a) => a.kind === "insufficient_time").length;
  const hasAssignments =
    plan.days.some((d) => d.blocks.length > 0) || plan.atRisk.length > 0 || plan.undated.length > 0;
  const alertCls = (k: "ok" | "warn" | "error") => (k === "ok" ? "alert-success" : k === "warn" ? "alert-warning" : "alert-error");

  return (
    <div>
      {/* Header (V7) */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{greeting()}, {firstName}</h1>
          <p className="mt-1 text-sm">
            {todayLong} · {plan.days.length}-day plan
            <span className={`badge ${statusPill.cls} ml-3 align-middle`}>{statusPill.text}</span>
          </p>
          <p className="caption mt-1">
            Last synced: {fmtSynced(payload.syncedAt)}{payload.accountName ? ` · ${payload.accountName}` : ""}
          </p>
        </div>
        <button onClick={runSync} className="btn btn-md btn-secondary" disabled={syncing || !payload.connected}>
          {syncing ? "Syncing…" : "Sync from Canvas"}
        </button>
      </div>

      {/* Toast (V6) */}
      {notice && (
        <div className={`toast alert ${alertCls(notice.kind)}`} role="status">
          <div>
            {notice.text}
            {warnings.length > 0 && <span className="block text-xs opacity-80">Failed: {warnings.join(", ")}</span>}
          </div>
        </div>
      )}

      {/* Not connected (V8) */}
      {!payload.connected && (
        <div className="card card-default mt-6 p-8 text-center">
          <div className="flex justify-center" style={{ color: "var(--accent)" }}><Glyph d={ICON.calendar} size={32} /></div>
          <p className="mt-3 font-medium" style={{ color: "var(--text-primary)" }}>Let&apos;s build your plan.</p>
          <p className="mt-1">Connect your Canvas account and we&apos;ll turn your assignments into a daily plan.</p>
          <Link href="/connections" className="btn btn-md btn-primary mt-4">Connect Canvas</Link>
        </div>
      )}

      {payload.connected && (
        <>
          {/* Hours + summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr]">
            <form onSubmit={applyHours} className="card card-default p-4">
              <label className="mb-2 block" htmlFor="hours">
                Hours for this plan <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· default in Settings</span>
              </label>
              <div className="flex items-end gap-3">
                <input id="hours" type="number" min="0.5" max="24" step="0.5" className="input w-28"
                  value={hours} onChange={(e) => setHours(e.target.value)} />
                <button type="submit" className="btn btn-md btn-primary">Apply</button>
              </div>
            </form>
            <div className="card card-default grid grid-cols-3 p-4 text-center">
              <Stat icon={ICON.list} iconColor="var(--accent)" label="Due in window" value={plan.inWindowDueCount} first />
              <Stat icon={ICON.alert} iconColor="var(--warning)" label="At risk" value={atRiskCount} accent={atRiskCount > 0} />
              <Stat icon={ICON.clock} iconColor="var(--accent)" label="Planned hrs" value={plan.totalPlannedHours} />
            </div>
          </div>

          {/* Skeletons while first sync runs (V5) */}
          {syncing && !hasAssignments && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
              ))}
            </div>
          )}

          {/* Empty state (V8) */}
          {!hasAssignments && !syncing && (
            <div className="card card-default mt-6 p-8 text-center">
              <div className="flex justify-center" style={{ color: "var(--text-muted)" }}><Glyph d={ICON.inbox} size={32} /></div>
              <p className="mt-3 font-medium" style={{ color: "var(--text-primary)" }}>Nothing to plan yet.</p>
              <p className="mt-1">
                {payload.stale
                  ? "We couldn't reach Canvas and there's nothing cached. Try Sync once Canvas is back."
                  : "Hit Sync from Canvas to pull your latest coursework."}
              </p>
            </div>
          )}

          {/* AT_RISK */}
          {plan.atRisk.length > 0 && (
            <section className="mt-8">
              <SectionHeader icon={ICON.alert} color="var(--destructive)" text="Needs attention" />
              <div className="mt-3 space-y-2">
                {plan.atRisk.map((a) => (
                  <div key={`risk-${a.canvasId}`} className="card lift flex items-center justify-between p-3.5"
                    style={{ background: "var(--destructive-subtle)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {a.htmlUrl ? <a href={a.htmlUrl} target="_blank" rel="noreferrer" className="link-plain">{a.name}</a> : a.name}
                      </p>
                      <p className="caption flex items-center truncate">
                        <CourseDot name={a.courseName} />{a.courseName} · due {fmtDue(a.dueAt)}
                      </p>
                    </div>
                    <span className="badge badge-destructive ml-3 shrink-0">
                      {a.kind === "overdue" ? "Past due" : `+${a.shortfallHours}h won't fit`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Today + Upcoming (V3/V4/V1/V2) */}
          {hasAssignments && (
            <>
              <section className="mt-8">
                <SectionHeader icon={ICON.sun} color="var(--accent)" text="Today" />
                <div className="mt-3"><DayCard day={plan.days[0]} today /></div>
              </section>
              {plan.days.length > 1 && (
                <section className="mt-8">
                  <SectionHeader icon={ICON.calendar} color="var(--accent)" text="Upcoming" />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {plan.days.slice(1).map((day) => <DayCard key={day.date} day={day} />)}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Undated */}
          {plan.undated.length > 0 && (
            <section className="mt-8">
              <SectionHeader icon={ICON.inbox} color="var(--text-muted)" text="No due date" />
              <div className="mt-3 space-y-2">
                {plan.undated.map((u) => (
                  <div key={`und-${u.canvasId}`} className="card card-default lift flex items-center justify-between p-3.5">
                    <p className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                      {u.htmlUrl ? <a href={u.htmlUrl} target="_blank" rel="noreferrer" className="link-plain">{u.name}</a> : u.name}
                    </p>
                    <span className="caption ml-3 flex shrink-0 items-center"><CourseDot name={u.courseName} />{u.courseName}</span>
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

function SectionHeader({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Glyph d={icon} color={color} />
      <h6 style={{ margin: 0 }}>{text}</h6>
    </div>
  );
}

function CourseDot({ name }: { name: string }) {
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: courseColor(name), marginRight: 6, flexShrink: 0 }} />;
}

function DayCard({ day, today }: { day: PlanDay; today?: boolean }) {
  const pct = day.capacity > 0 ? Math.min(100, (day.allocated / day.capacity) * 100) : 0;
  const full = pct >= 100 && day.allocated > 0;
  return (
    <div
      className="card card-default lift p-4"
      style={{
        borderLeft: `3px solid ${today ? "var(--accent)" : "transparent"}`,
        background: today ? "var(--accent-subtle)" : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {fmtDayLabel(day.date, day.weekday)}
          {today && <span style={{ color: "var(--accent)" }}> · Today</span>}
        </p>
        <span className="caption">{day.allocated}/{day.capacity}h</span>
      </div>
      <div className="progress-track mt-2">
        <div className="progress-fill" style={{ width: `${pct}%`, background: full ? "var(--warning)" : "var(--accent)" }} />
      </div>
      <div className="mt-3 space-y-2">
        {day.blocks.length === 0 && <p className="caption">No work scheduled.</p>}
        {day.blocks.map((b, i) => (
          <div key={`${day.date}-${b.canvasId}-${i}`} className="flex items-start gap-2.5">
            <span className="badge badge-violet mt-0.5 shrink-0">{b.hours}h</span>
            <div className="min-w-0">
              <p className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                {b.htmlUrl ? <a href={b.htmlUrl} target="_blank" rel="noreferrer" className="link-plain">{b.name}</a> : b.name}
              </p>
              <p className="caption flex items-center truncate">
                <CourseDot name={b.courseName} />
                {b.courseName} · due {fmtDue(b.dueAt)}{b.pointsPossible != null ? ` · ${b.pointsPossible} pts` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, iconColor, label, value, accent, first }: { icon: string; iconColor: string; label: string; value: number; accent?: boolean; first?: boolean }) {
  return (
    <div className="px-2" style={{ borderLeft: first ? "none" : "1px solid var(--border-subtle)" }}>
      <p className="text-2xl font-semibold" style={{ color: accent ? "var(--destructive)" : "var(--text-primary)" }}>{value}</p>
      <p className="caption flex items-center justify-center gap-1">
        <Glyph d={icon} size={13} color={iconColor} />{label}
      </p>
    </div>
  );
}
