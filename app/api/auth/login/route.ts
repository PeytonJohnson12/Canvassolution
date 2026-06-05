import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

// FR-2: login. Generic error on bad credentials (FR-2.3).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  await createSession(user.id);
  // Admins → Kanban; students with no Canvas connection → Connections (first step); else → plan.
  let redirect = "/";
  if (user.isAdmin) {
    redirect = "/admin";
  } else {
    const cred = await prisma.canvasCredential.findUnique({ where: { userId: user.id } });
    if (!cred) redirect = "/connections";
  }
  return NextResponse.json({ ok: true, redirect });
}
