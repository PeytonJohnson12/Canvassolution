# StudyPlan — Team Roles

Roles and ownership for building StudyPlan. On a small team one person may wear
several of these "hats" — the point is that for any change, it's clear who owns
the call and what "done" means. Roles map to the developer loop in `CLAUDE.md`
(Plan → Write → Test/Review → Document → Ship).

---

## 1. UX Designer
**Mission:** make the product easy to understand and use — the *experience*, not the pixels.
**Owns:** user stories & journeys (`README.md`), the flow through each screen
(Plan, Connections, Settings, Account, Admin Kanban), empty/stale/error states, and microcopy.
**Responsibilities:**
- Define and prioritize user stories; keep them honest about status.
- Design flows: onboarding → connect Canvas → see plan; admin login → board.
- Specify every state (loading, empty, error, stale cache, AT_RISK) so nothing is undefined.
- Own accessibility (labels, focus order, contrast, keyboard use).
**Done when:** a new user can reach the goal without guidance, and every state has a defined behavior.

## 2. UI Developer
**Mission:** make it look premium and consistent — the *visual layer*.
**Owns:** the design system in `app/globals.css` (tokens + component classes),
`tailwind.config.ts`, the presentation of `components/*`, dark mode
(`ThemeToggle`, the anti-FOUC script), responsiveness, and `BrandMark`.
**Responsibilities:**
- Keep styling on the design system — component classes + tokens (`var(--accent)`…),
  Tailwind for layout only. No ad-hoc color utilities or inline color soup.
- Maintain light/dark parity and responsive layouts.
- Translate UX flows into clean, consistent components.
**Done when:** the change uses the system, looks right in both themes and at desktop/narrow widths.

## 3. Software Architect
**Mission:** keep the system coherent, correct, and fast.
**Owns:** overall Next.js structure, the scheduler design (`lib/scheduler.ts`) and the
**G1 invariant**, data flow (`lib/plan.ts`), API contracts, performance, and the
standards in `CLAUDE.md`.
**Responsibilities:**
- Approve structural/tech decisions and keep modules at the right altitude.
- Guard G1 (no due assignment ever omitted) and the perf targets (plan renders fast on a 500-item cache).
- Decide when to evolve (e.g., `db push` → migrations; manual token → OAuth).
**Done when:** the change fits the architecture, G1 holds, and there's no fragile band-aid.

## 4. Data & Backend Engineer
**Mission:** make data and storage correct and resilient; fix errors.
**Owns:** `prisma/schema.prisma` + the local DB, `lib/sync.ts`, `lib/canvas.ts`,
`lib/auth.ts`, `app/api/**`, and the seed scripts.
**Responsibilities:**
- Model data; run `npm run db:push` on schema changes; keep upserts idempotent.
- Own Canvas sync + the FR-5 failure matrix and FR-7 stale/partial-failure handling.
- Sessions/auth (`requireUser`/`requireAdmin`); diagnose and fix runtime errors.
**Done when:** data is correct, failures degrade safely (cache never wiped), and the path is covered by a test.

## 5. QA / Test Engineer
**Mission:** prove it works before it ships.
**Owns:** `scripts/test-scheduler.ts`, the `/code-review` pass, and verification.
**Responsibilities:**
- Drive TDD: write/extend tests first; keep the G1 fuzz + edge cases green.
- Run `npm run build` + scheduler tests on every change; run `/code-review` and triage findings.
- Reproduce bugs with a failing test before they're fixed.
**Done when:** build + tests are green and a code review found nothing real (or it's fixed).

## 6. DevOps / Release Engineer
**Mission:** smooth, repeatable build/run/ship.
**Owns:** git + GitHub (`origin/main`), branching/PRs, `.env`/`.env.example`, the npm
scripts, local run/preview, and (future) CI.
**Responsibilities:**
- Keep the repo clean (nothing secret/generated committed); manage branches and PRs.
- Own env + setup so a teammate can clone → install → `db:push` → `seed:admin` → run.
- Stand up CI (build + scheduler tests on PRs) and branch protection when ready.
**Done when:** main builds, history is clean, and a fresh clone runs in a few documented steps.

## 7. Product Owner
**Mission:** decide what to build and why.
**Owns:** the PRD/scope, user-story priority, and the success metrics (G1–G5).
**Responsibilities:**
- Prioritize the roadmap (e.g., completed/upcoming tracking, insights panel, OAuth).
- Hold the line on MVP scope; send deferred items to a backlog.
- Make the product calls (e.g., what "completed" means: Canvas status vs. manual).
**Done when:** the team knows the next most valuable thing and its acceptance criteria.

## 8. Security & Privacy Lead
**Mission:** protect credentials and user data; know the risk tradeoffs.
**Owns:** auth/session security, Canvas token handling, admin access, and the
plaintext-by-design decision.
**Responsibilities:**
- Track the plaintext password/token tradeoff and define when to harden (hashing, encryption-at-rest).
- Own the path to Canvas OAuth / developer keys (replacing manual tokens).
- Review anything touching auth, admin gating, or stored secrets.
**Done when:** credentials are handled per the agreed policy and admin areas are properly gated.

---

### Who leads each loop step
- **Plan:** Product Owner + Software Architect
- **Write:** UI Developer (front end) · Data & Backend Engineer (data/API)
- **Test / Review:** QA / Test Engineer (+ Architect for design review)
- **Document & Ship:** the author + DevOps / Release Engineer
