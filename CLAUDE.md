# StudyPlan — project notes

Localhost, single-user Canvas study planner (+ a shared admin Kanban).
Next.js 15 (App Router, TS) · SQLite via Prisma · plain-CSS design system + Tailwind for layout.

> This file holds project-specific rules. It layers on top of the global
> `~/.claude/CLAUDE.md`; where this file is more specific, follow this one.

> **Working agreement (read this first):** every time the user asks you to *do* or
> *build* something, re-read this file — the Developer loop, User stories, Team
> roles, and Conventions — and address the user as **"Brutus"** to confirm you've
> checked it.

## Developer loop (follow for every non-trivial change)

1. **Plan** — decide the approach before writing code. Use plan mode for anything
   non-trivial; state assumptions and the success check for each step.
2. **Write the code** — implement the plan. Keep changes surgical; match existing style.
3. **Test the code — code review + TDD:**
   - Write or extend tests first where practical (TDD). For the scheduler, add cases to
     `scripts/test-scheduler.ts` and keep the **G1** invariant green.
   - Run `npm run build` (compiles + typechecks) and the scheduler tests — both must pass.
   - Run a code review (`/code-review`) and fix the real findings before moving on.
4. **Document, then ship:**
   - Update the docs (`README.md` + this file) so there are **no gaps** — every new
     command, env var, route, table, or behavior is written down.
   - Commit locally with a clear message (the *why*, not just the *what*).
   - Push to GitHub (`origin/main`).

Skip steps only for trivial one-liners, or when the user says to.

## User stories
What the student should be able to do (status: ✅ built · 🟡 partial · ⬜ planned).
Full write-up in `README.md`.
1. **See & optimize their schedule** ✅ — Plan view + earliest-deadline-first scheduler.
2. **See high-priority assignments & important tasks** 🟡 — ordered by due→points, `AT_RISK`
   flags slipping work; no dedicated "top priorities" highlight yet.
3. **See completed vs. upcoming assignments** ⬜ — upcoming is shown; **no completion
   tracking yet** (needs Canvas submission status and/or a manual "mark done").
4. **Insights & a recommended day plan** 🟡 — the daily plan answers "how to schedule my
   day"; no explicit insights/recommendations panel yet.

## Team roles
Hats — on a small team one person wears several. Full detail in `ROLES.md`.
- **UX Designer** — the experience: flows, every state, accessibility. Owns user stories & screen journeys.
- **UI Developer** — the visual layer. Owns `app/globals.css` design system, `tailwind.config.ts`, dark mode, responsiveness.
- **Software Architect** — coherence/correctness/perf. Owns structure, `lib/scheduler.ts` + the **G1** invariant, data flow, tech decisions.
- **Data & Backend Engineer** — storage/data/errors. Owns `prisma/schema.prisma` + DB, `lib/sync.ts`, `lib/canvas.ts`, `lib/auth.ts`, `app/api/**`.
- **QA / Test Engineer** — proves it works. Owns `scripts/test-scheduler.ts`, `/code-review`, TDD, G1 verification.
- **DevOps / Release Engineer** — build/run/ship. Owns git + GitHub, `.env`, npm scripts, future CI.
- **Product Owner** — what to build & why. Owns PRD/scope, story priority, success metrics G1–G5.
- **Security & Privacy Lead** — credentials/data. Owns auth, Canvas-token handling, the plaintext tradeoff, the OAuth path.

Loop ownership: **Plan** = PO + Architect · **Write** = UI Dev + Backend Eng · **Test** = QA (+ Architect review) · **Ship** = author + DevOps.

## Commands
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — prod build + typecheck (run before committing)
- `npm run db:push` — apply prisma/schema.prisma to the local DB (no migrations)
- `npm run seed:admin` — create/update admin from ADMIN_EMAIL/ADMIN_PASSWORD in .env
- `node --experimental-strip-types scripts/test-scheduler.ts` — scheduler tests
- `node scripts/seed-demo.mjs` — demo student + assignments

## The one rule that must never break (G1)
The generated plan must NEVER omit an assignment due in the planning window.
`lib/scheduler.ts` enforces this by construction AND asserts
`representedCount === inWindowDueCount` (throws otherwise).
➡ After ANY change to `lib/scheduler.ts`, run the scheduler tests and keep them green.

## Where things live
- `lib/scheduler.ts` — rule-based planner (FR-9) + the G1 guard
- `lib/sync.ts` / `lib/canvas.ts` — Canvas sync + API client (pagination, FR-5 failure matrix)
- `lib/plan.ts` — single source that loads cache + runs the planner
- `lib/auth.ts` — sessions; `getCurrentUser` / `requireUser` / `requireAdmin`
- `app/(app)/` student shell · `app/admin/` admin Kanban · `app/api/` routes
- `prisma/schema.prisma` + `dev.db` (gitignored)

## Conventions
- Passwords & Canvas tokens are stored PLAINTEXT by design (local MVP). Do not add
  hashing/encryption unless explicitly asked.
- Styling: use the design-system component classes (`.btn`, `.card`, `.input`,
  `.badge`, `.progress`) and tokens (`var(--accent)`, etc.) from `app/globals.css`.
  Tailwind is layered UNDER the system for layout only — avoid ad-hoc color utilities.
- Dark mode: `[data-theme]` on <html>, set by the anti-FOUC script in `app/layout.tsx`.
- Sync is cache-on-demand only; NEVER wipe the cache on a failed sync (FR-7).

## Gotchas
- `prisma generate` throws EPERM on Windows if a dev/preview server holds the engine
  DLL — stop the server first.
- Next 15: `cookies()`/`headers()` are async — await them.
- `scripts/` is excluded from tsconfig (it uses `.ts` import extensions for Node's
  type-stripping runner). Standalone scripts call `process.loadEnvFile()` to read .env.
- DB uses `db push`, not migrations — after pulling schema changes, run `npm run db:push`.

## Don't commit
`.env`, `prisma/dev.db`, `node_modules`, `.next`, `*.tsbuildinfo`, `next-env.d.ts` (all gitignored).
