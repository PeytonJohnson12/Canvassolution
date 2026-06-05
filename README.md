# StudyPlan

A locally-hosted, single-user web app that connects to one student's Canvas
account, caches their assignments/announcements, and runs a deterministic
rule-based scheduler to produce a daily study plan.

**Headline guarantee (G1):** the plan never omits an assignment that is due in
the planning window. Every in-window due assignment appears as scheduled work,
an `AT_RISK` flag, or both — enforced by construction *and* a runtime assertion
in the scheduler.

## User stories

What the student should be able to do. Status: ✅ built · 🟡 partial · ⬜ planned.

1. **See & optimize their schedule** — *"I can see my schedule and have it optimized for me."*
   ✅ The Plan view shows a per-day plan; the scheduler packs work earliest-deadline-first within the daily hour budget.
2. **See high-priority assignments & important tasks** — *"I can see which assignments matter most."*
   🟡 The planner orders by due date then points, and `AT_RISK` surfaces what's slipping — but there's no dedicated "top priorities" highlight/sort yet.
3. **See completed vs. upcoming assignments** — *"I can see what I've finished and what's coming up."*
   ⬜ Upcoming work is shown; there is **no completion tracking** yet (Canvas submission status isn't pulled and there's no "mark done"). Needs a completed/upcoming view.
4. **Get insights & a recommended day plan** — *"I can see which assignments to do and how to schedule my day."*
   🟡 The daily plan already answers "how to schedule my day," and `AT_RISK` is an early insight — but an explicit recommendations/insights panel ("focus on X today," workload warnings) isn't built yet.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript) — UI + API routes in one process
- **SQLite** via **Prisma** — local file DB (`prisma/dev.db`)
- **Tailwind CSS** — minimal/premium design (violet accent, Inter, card layout)

## Quick start

```bash
cd studyplan
npm install
cp .env.example .env   # sets DATABASE_URL for the local SQLite file
npm run db:push        # create prisma/dev.db from the schema
npm run dev            # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

Then open the app, **sign up**, go to **Connections**, and enter your Canvas
domain (e.g. `school.instructure.com`) + a personal access token
(Canvas → Account → Settings → New Access Token).

## How it works

| Screen | What it does | PRD |
|---|---|---|
| **Plan** (`/`) | Default landing. Per-day plan over the window, stat bar, AT_RISK + undated sections, Refresh, hours override. | FR-3, FR-8, FR-9 |
| **Connections** | Save Canvas domain + token; validates immediately and shows distinct status. | FR-4, FR-5 |
| **Settings** | Defaults: hours/day, planning window (days), effort/assignment. | FR-8, §9 |
| **Account** | Edit profile (name, email, phone, password). | FR-1 |

### Sync model (FR-6/FR-7)
Cache-on-demand only: a sync runs automatically once per browser session (≈ on
login) and on the explicit **Refresh** button. There is **no** background sync.
On any validation/network failure the existing cache is **preserved** and still
used for planning, labeled *stale*. A single course failing mid-sync is a
non-blocking partial failure — its cached rows are kept and a warning lists it.

### Scheduler (FR-9) — `lib/scheduler.ts`
Earliest-deadline-first packing of each assignment's flat effort estimate into
each day's hour budget, from the earliest available day up to its due date.
Anything that can't fit before its due date is split (what fits is scheduled,
the remainder is `AT_RISK`). Overdue items are surfaced as `AT_RISK · Past due`;
undated items go in a separate "No due date" bucket. The function asserts
`representedCount === inWindowDueCount` before returning (G1 guard).

## Defaults chosen for the truncated PRD

The source PRD was cut off mid-FR-9, and §6/§8/§9 weren't included. These
defaults were applied (all easy to change):

| Area | Default | Where to change |
|---|---|---|
| Effort per assignment (`E`) | 2.0 h (flat) | Settings → effort/assignment |
| Planning window (`W`) | 7 days, incl. today | Settings → planning window |
| Hours model | one value applied to every day | — |
| Hours range | `0 < hours ≤ 24`, fractional ok | `app/api/plan`, `app/api/settings` |
| Effort estimate | flat per assignment (no per-type) | `lib/plan.ts` / Settings |

### Canvas endpoints used (§6)
- Validate: `GET /api/v1/users/self`
- Courses: `GET /api/v1/courses?enrollment_state=active`
- Assignments: `GET /api/v1/courses/:id/assignments`
- Announcements: `GET /api/v1/courses/:id/discussion_topics?only_announcements=true`

All requested with `per_page=100` and `Link` (`rel="next"`) pagination. Upserts
are keyed on Canvas id (idempotent re-sync).

### Failure matrix (FR-5)
`valid` (200) · `invalid_token` (401) · `bad_domain` (DNS/refused/404) ·
`unreachable` (timeout/network) · `insufficient_scope` (200 on `/users/self`
but 403 on a data call) · `error` (any other non-2xx).

## Testing

```bash
node --experimental-strip-types scripts/test-scheduler.ts
```

Covers normal fit, over-capacity overflow, zero hours, overdue, undated,
beyond-window, EDF tie-breaking, and a 200-case randomized fuzz — all asserting
the G1 invariant.

`scripts/seed-demo.mjs` seeds a demo Canvas connection + assignments for a
signed-up user (`node scripts/seed-demo.mjs`) to preview a populated plan
without a live Canvas.

## Local data & reset

The SQLite DB lives at `prisma/dev.db`. To wipe all local data:

```bash
rm prisma/dev.db && npm run db:push
```

## Admin board (Kanban)

A shared admin Kanban board lives at `/admin`, gated behind an admin login.

**Set it up:**
1. In `.env`, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your own values.
2. Run `npm run seed:admin` to create/update the admin account (`isAdmin = true`).
3. Log in at `/login` with those credentials — admins are auto-redirected to `/admin`; everyone else is bounced.

The board has three columns (To Do · In Progress · Done). Add a card via the input in each column, move cards by **drag-and-drop** or the **← →** arrows, and delete with **✕**. Cards persist in the local DB (`KanbanCard` table) and are shared by everyone who logs in as admin on that install. Teammates on a fresh clone run `npm run db:push` then `npm run seed:admin`.

## Out of scope (MVP)

Per the PRD: passwords and the Canvas token are stored in **plaintext** (local,
single-user, by design — no hashing/encryption). No background sync, no
multi-user, no LLM/ML, no rate-limiting. Deferred items belong in `BACKLOG.md`.
