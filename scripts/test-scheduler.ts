import assert from "node:assert";
import { generatePlan } from "../lib/scheduler.ts";
import type { SchedulerAssignment } from "../lib/scheduler.ts";

const NOW = new Date("2026-06-03T09:00:00"); // local
const day = (n: number, hour = 23) => new Date(2026, 5, 3 + n, hour, 0, 0); // n days from NOW

function mk(id: number, dueAt: Date | null, points: number | null = 10): SchedulerAssignment {
  return { canvasId: id, name: `A${id}`, courseName: "C", dueAt, pointsPossible: points, htmlUrl: null };
}

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// G1 invariant helper: every plan must represent every in-window due assignment.
function assertG1(plan: ReturnType<typeof generatePlan>) {
  assert.strictEqual(plan.representedCount, plan.inWindowDueCount, "G1: represented != in-window due");
}

console.log("Scheduler tests:");

check("normal fit: all scheduled, none at risk", () => {
  const a = [mk(1, day(1)), mk(2, day(2)), mk(3, day(3))];
  const plan = generatePlan(a, 8, 7, 2, NOW);
  assertG1(plan);
  assert.strictEqual(plan.inWindowDueCount, 3);
  assert.strictEqual(plan.atRisk.length, 0);
  assert.strictEqual(plan.totalPlannedHours, 6);
});

check("over-capacity: overflow flagged AT_RISK but still represented", () => {
  // 10 assignments due tomorrow (days 0..1 usable), H=2 => 4h capacity, E=2 => 2 fit, 8 at risk
  const a = Array.from({ length: 10 }, (_, i) => mk(i + 1, day(1)));
  const plan = generatePlan(a, 2, 7, 2, NOW);
  assertG1(plan);
  assert.strictEqual(plan.inWindowDueCount, 10);
  const insufficient = plan.atRisk.filter((x) => x.kind === "insufficient_time");
  assert.strictEqual(insufficient.length, 8);
});

check("zero hours: everything at risk, still represented", () => {
  const a = [mk(1, day(0)), mk(2, day(3))];
  const plan = generatePlan(a, 0, 7, 2, NOW);
  assertG1(plan);
  assert.strictEqual(plan.atRisk.filter((x) => x.kind === "insufficient_time").length, 2);
  assert.strictEqual(plan.totalPlannedHours, 0);
});

check("zero effort: nothing scheduled, but represented & visible as 0h markers", () => {
  const a = [mk(1, day(1)), mk(2, day(3))];
  const plan = generatePlan(a, 8, 7, 0, NOW); // E = 0 must not crash the G1 guard
  assertG1(plan);
  assert.strictEqual(plan.inWindowDueCount, 2);
  assert.strictEqual(plan.atRisk.length, 0);
  const blocks = plan.days.flatMap((d) => d.blocks);
  assert.strictEqual(blocks.length, 2);
  assert.ok(blocks.every((b) => b.hours === 0));
});

check("overdue: surfaced as AT_RISK, excluded from in-window count", () => {
  const a = [mk(1, day(-2)), mk(2, day(1))];
  const plan = generatePlan(a, 8, 7, 2, NOW);
  assertG1(plan);
  assert.strictEqual(plan.inWindowDueCount, 1);
  assert.strictEqual(plan.overdueCount, 1);
  assert.strictEqual(plan.atRisk.filter((x) => x.kind === "overdue").length, 1);
});

check("undated: bucketed separately, not in-window", () => {
  const a = [mk(1, null), mk(2, day(2))];
  const plan = generatePlan(a, 8, 7, 2, NOW);
  assertG1(plan);
  assert.strictEqual(plan.undated.length, 1);
  assert.strictEqual(plan.inWindowDueCount, 1);
});

check("beyond window: not scheduled, not counted", () => {
  const a = [mk(1, day(30)), mk(2, day(2))];
  const plan = generatePlan(a, 8, 7, 2, NOW);
  assertG1(plan);
  assert.strictEqual(plan.beyondWindowCount, 1);
  assert.strictEqual(plan.inWindowDueCount, 1);
});

check("due today: claims today's capacity, EDF order", () => {
  const a = [mk(1, day(0)), mk(2, day(0), 50)]; // both today; higher points first on tie
  const plan = generatePlan(a, 8, 7, 2, NOW);
  assertG1(plan);
  assert.strictEqual(plan.days[0].blocks[0].canvasId, 2); // 50pts before 10pts
});

check("randomized fuzz: G1 holds for 200 random caches", () => {
  for (let t = 0; t < 200; t++) {
    const n = Math.floor(Math.random() * 40);
    const a = Array.from({ length: n }, (_, i) =>
      mk(i + 1, Math.random() < 0.15 ? null : day(Math.floor(Math.random() * 16) - 3), Math.floor(Math.random() * 100))
    );
    const H = Math.random() * 10;
    const W = 1 + Math.floor(Math.random() * 14);
    const E = Math.random() < 0.1 ? 0 : 0.5 + Math.random() * 4;
    assertG1(generatePlan(a, H, W, E, NOW));
  }
});

console.log(`\n${passed} test groups passed.`);
