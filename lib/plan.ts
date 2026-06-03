import { prisma } from "./prisma";
import { generatePlan, Plan, SchedulerAssignment } from "./scheduler";

export interface PlanPayload {
  connected: boolean;
  accountName: string | null;
  syncedAt: string | null;
  validationStatus: string | null;
  stale: boolean; // cache shown but last validation/sync is not "valid"
  hours: number;
  windowDays: number;
  plan: Plan;
}

/**
 * Loads the cached assignments and runs the rule-based planner. `hoursOverride`
 * lets the Plan view regenerate with a different daily budget (FR-8) without
 * persisting it.
 */
export async function loadPlan(userId: number, hoursOverride?: number): Promise<PlanPayload> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const cred = await prisma.canvasCredential.findUnique({ where: { userId } });
  const rows = await prisma.assignment.findMany({
    where: { userId },
    include: { course: true },
  });

  const hours =
    hoursOverride !== undefined && Number.isFinite(hoursOverride)
      ? hoursOverride
      : user.defaultHoursPerDay;

  const assignments: SchedulerAssignment[] = rows.map((a) => ({
    canvasId: a.canvasId,
    name: a.name,
    courseName: a.course.name,
    dueAt: a.dueAt,
    pointsPossible: a.pointsPossible,
    htmlUrl: a.htmlUrl,
  }));

  const plan = generatePlan(assignments, hours, user.planningWindowDays, user.defaultEffortHours);

  const status = cred?.lastValidationStatus ?? null;
  const stale = !!cred && status !== null && status !== "valid";

  return {
    connected: !!cred,
    accountName: cred?.accountName ?? null,
    syncedAt: cred?.syncedAt ? cred.syncedAt.toISOString() : null,
    validationStatus: status,
    stale,
    hours,
    windowDays: user.planningWindowDays,
    plan,
  };
}
