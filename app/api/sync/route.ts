import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runSync } from "@/lib/sync";

// FR-6: explicit Refresh. (Login-time sync is triggered from the Plan page.)
export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await runSync(user.id);
  return NextResponse.json(result);
}
