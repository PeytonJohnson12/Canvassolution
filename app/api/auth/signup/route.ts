import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// FR-1: sign up / onboarding.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const fullName = String(body.fullName ?? "").trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  const tosAccepted = body.tosAccepted === true;

  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  if (!fullName) errors.fullName = "Name is required.";
  if (!tosAccepted) errors.tos = "You must accept the Terms of Service.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ errors: { email: "An account with this email already exists." } }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, password, fullName, phone, tosAcceptedAt: new Date() },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
