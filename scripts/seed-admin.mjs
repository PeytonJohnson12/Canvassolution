// Creates/updates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
// Run: npm run seed:admin
import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(); // load .env (Node 20.12+/24)
} catch {
  // .env optional if vars are already in the environment
}

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first, then re-run `npm run seed:admin`.");
  process.exit(1);
}
if (password === "change-me") {
  console.error("ADMIN_PASSWORD is still the placeholder 'change-me' — set a real password in .env first.");
  process.exit(1);
}

const prisma = new PrismaClient();

const user = await prisma.user.upsert({
  where: { email },
  update: { password, isAdmin: true },
  create: { email, password, fullName: "Admin", isAdmin: true, tosAcceptedAt: new Date() },
});

console.log(`Admin ready: ${user.email} → log in and you'll land on /admin (the Kanban board).`);
await prisma.$disconnect();
