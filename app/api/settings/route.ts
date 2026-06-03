import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Settings: planning defaults (hours/day, window length, effort/assignment).
export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  if (body.defaultHoursPerDay !== undefined) {
    const h = Number(body.defaultHoursPerDay);
    if (!(Number.isFinite(h) && h > 0 && h <= 24)) errors.defaultHoursPerDay = "Enter a number between 0 and 24.";
    else data.defaultHoursPerDay = h;
  }
  if (body.planningWindowDays !== undefined) {
    const w = Number(body.planningWindowDays);
    if (!(Number.isInteger(w) && w >= 1 && w <= 60)) errors.planningWindowDays = "Enter a whole number of days (1–60).";
    else data.planningWindowDays = w;
  }
  if (body.defaultEffortHours !== undefined) {
    const e = Number(body.defaultEffortHours);
    if (!(Number.isFinite(e) && e > 0 && e <= 24)) errors.defaultEffortHours = "Enter a number between 0 and 24.";
    else data.defaultEffortHours = e;
  }

  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
