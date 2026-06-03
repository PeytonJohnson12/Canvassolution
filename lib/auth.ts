import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";

const COOKIE = "sp_session";

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({ data: { token, userId } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // persist until explicit logout (FR-2.2)
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  jar.delete(COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  return session?.user ?? null;
}

/** For API routes: returns the user or null (caller returns 401). */
export async function requireUser() {
  return getCurrentUser();
}
