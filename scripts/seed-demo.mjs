import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const EMAIL = "maya.ui@test.edu";
const user = await prisma.user.findUnique({ where: { email: EMAIL } });
if (!user) {
  console.error(`No user ${EMAIL}; sign up in the browser first.`);
  process.exit(1);
}

const now = new Date();
const day = (n, h = 17) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + n, h, 0, 0);

await prisma.canvasCredential.upsert({
  where: { userId: user.id },
  update: { lastValidationStatus: "valid", lastValidatedAt: now, syncedAt: now, accountName: "Maya Rivera" },
  create: {
    userId: user.id, host: "demo.instructure.com", apiBase: "https://demo.instructure.com/api/v1",
    token: "demo", lastValidationStatus: "valid", lastValidatedAt: now, syncedAt: now, accountName: "Maya Rivera",
  },
});

const courses = [
  { canvasId: 9001, name: "CS 350 · Databases" },
  { canvasId: 9002, name: "WRIT 220 · Rhetoric" },
];
const courseRows = {};
for (const c of courses) {
  courseRows[c.canvasId] = await prisma.course.upsert({
    where: { canvasId: c.canvasId },
    update: { name: c.name, userId: user.id },
    create: { canvasId: c.canvasId, userId: user.id, name: c.name },
  });
}

const assignments = [
  { id: 9103, c: 9002, name: "Reading response 6", due: day(0), pts: 20 },
  { id: 9110, c: 9001, name: "Discussion post", due: day(0), pts: 30 },
  { id: 9101, c: 9001, name: "Problem Set 4", due: day(1), pts: 100 },
  { id: 9102, c: 9001, name: "Lab: Indexing", due: day(1), pts: 50 },
  { id: 9104, c: 9002, name: "Essay draft", due: day(2), pts: 100 },
  { id: 9105, c: 9001, name: "Quiz 3", due: day(3), pts: 30 },
  { id: 9107, c: 9002, name: "Peer review", due: day(4), pts: 40 },
  { id: 9106, c: 9001, name: "Final project proposal", due: day(5), pts: 100 },
  { id: 9108, c: 9001, name: "Homework 3 (late)", due: day(-1), pts: 60 },
  { id: 9109, c: 9002, name: "Participation (ongoing)", due: null, pts: null },
];

for (const a of assignments) {
  const data = {
    userId: user.id, courseId: courseRows[a.c].id, courseCanvasId: a.c,
    name: a.name, dueAt: a.due, pointsPossible: a.pts,
    htmlUrl: `https://demo.instructure.com/courses/${a.c}/assignments/${a.id}`,
  };
  await prisma.assignment.upsert({ where: { canvasId: a.id }, update: data, create: { canvasId: a.id, ...data } });
}

console.log(`Seeded ${assignments.length} assignments across ${courses.length} courses for ${EMAIL}.`);
await prisma.$disconnect();
