import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rows = await prisma.kanbanCard.findMany({ orderBy: { position: "asc" } });
  const cards = rows.map((c) => ({
    id: c.id,
    columnKey: c.columnKey,
    title: c.title,
    description: c.description,
    position: c.position,
  }));

  return (
    <div>
      <h1>Kanban board</h1>
      <p className="mt-1">Shared with your admin team — drag cards between columns or use the arrows.</p>
      <div className="mt-6">
        <KanbanBoard initialCards={cards} />
      </div>
    </div>
  );
}
