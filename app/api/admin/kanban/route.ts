import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const COLUMNS = ["todo", "doing", "done"];

async function nextPosition(): Promise<number> {
  const top = await prisma.kanbanCard.findFirst({ orderBy: { position: "desc" } });
  return (top?.position ?? 0) + 1;
}

// List all cards (admin-only).
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const cards = await prisma.kanbanCard.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json({ cards });
}

// Create a card.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const columnKey = COLUMNS.includes(body.columnKey) ? body.columnKey : "todo";
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const card = await prisma.kanbanCard.create({
    data: { title, description, columnKey, position: await nextPosition() },
  });
  return NextResponse.json({ card });
}

// Update a card (move column and/or edit text).
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.columnKey !== undefined) {
    if (!COLUMNS.includes(body.columnKey)) return NextResponse.json({ error: "Invalid column." }, { status: 400 });
    data.columnKey = body.columnKey;
    data.position = await nextPosition(); // moved cards go to the end of their column
  }
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    data.title = title;
  }
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;

  const card = await prisma.kanbanCard.update({ where: { id }, data });
  return NextResponse.json({ card });
}

// Delete a card.
export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  await prisma.kanbanCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
