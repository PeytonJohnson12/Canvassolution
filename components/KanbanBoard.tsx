"use client";

import { useState } from "react";

interface Card {
  id: number;
  columnKey: string;
  title: string;
  description: string | null;
  position: number;
}

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "doing", label: "In Progress" },
  { key: "done", label: "Done" },
];

export function KanbanBoard({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/kanban");
    if (res.ok) setCards((await res.json()).cards);
  }

  async function addCard(columnKey: string, title: string) {
    const t = title.trim();
    if (!t) return;
    const res = await fetch("/api/admin/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, columnKey }),
    });
    if (res.ok) {
      const created = (await res.json()).card;
      setCards((prev) => [...prev, created]);
    } else refresh();
  }

  async function moveCard(id: number, columnKey: string) {
    const card = cards.find((c) => c.id === id);
    if (!card || card.columnKey === columnKey) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, columnKey } : c))); // optimistic
    const res = await fetch("/api/admin/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, columnKey }),
    });
    if (res.ok) {
      const updated = (await res.json()).card;
      setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } else refresh();
  }

  async function renameCard(id: number, title: string) {
    const t = title.trim();
    const card = cards.find((c) => c.id === id);
    setEditingId(null);
    if (!card || !t || t === card.title) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, title: t } : c))); // optimistic
    const res = await fetch("/api/admin/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: t }),
    });
    if (!res.ok) refresh();
  }

  async function deleteCard(id: number) {
    setCards((prev) => prev.filter((c) => c.id !== id)); // optimistic
    const res = await fetch(`/api/admin/kanban?id=${id}`, { method: "DELETE" });
    if (!res.ok) refresh();
  }

  function moveByArrow(id: number, delta: number) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const idx = COLUMNS.findIndex((c) => c.key === card.columnKey);
    const target = COLUMNS[idx + delta];
    if (target) moveCard(id, target.key);
  }

  return (
    <div className="grid-3">
      {COLUMNS.map((col, colIndex) => {
        const colCards = cards
          .filter((c) => c.columnKey === col.key)
          .sort((a, b) => a.position - b.position);
        return (
          <div
            key={col.key}
            className="card card-default"
            style={{
              padding: "var(--space-16)",
              outline: `2px solid ${overCol === col.key ? "var(--accent)" : "transparent"}`,
              transition: "outline-color var(--transition-fast)",
            }}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
            onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId != null) moveCard(dragId, col.key);
              setDragId(null);
              setOverCol(null);
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-12)" }}>
              <h5 style={{ margin: 0 }}>{col.label}</h5>
              <span className="badge badge-default">{colCards.length}</span>
            </div>

            <div className="flex flex-col gap-2" style={{ minHeight: 48 }}>
              {colCards.map((card) => {
                const editing = editingId === card.id;
                return (
                  <div
                    key={card.id}
                    className="card card-bordered lift"
                    draggable={!editing}
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragId(card.id); }}
                    onDragEnd={() => setDragId(null)}
                    style={{ padding: "var(--space-12)", cursor: editing ? "auto" : "grab" }}
                  >
                    {editing ? (
                      <input
                        className="input"
                        defaultValue={card.title}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameCard(card.id, e.currentTarget.value);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={(e) => renameCard(card.id, e.currentTarget.value)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingId(card.id)}
                        title="Click to rename"
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)", textAlign: "left", background: "none", border: 0, padding: 0, cursor: "text", width: "100%" }}
                      >
                        {card.title}
                      </button>
                    )}
                    {card.description && <div className="caption" style={{ marginTop: 4 }}>{card.description}</div>}
                    <div className="flex items-center justify-between" style={{ marginTop: "var(--space-8)" }}>
                      <div className="flex gap-1">
                        <button type="button" className="btn btn-sm btn-ghost" disabled={colIndex === 0}
                          onClick={() => moveByArrow(card.id, -1)} aria-label="Move to previous column">←</button>
                        <button type="button" className="btn btn-sm btn-ghost" disabled={colIndex === COLUMNS.length - 1}
                          onClick={() => moveByArrow(card.id, 1)} aria-label="Move to next column">→</button>
                      </div>
                      <button type="button" className="btn btn-sm btn-ghost"
                        onClick={() => deleteCard(card.id)} aria-label="Delete card">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <AddForm onAdd={(title) => addCard(col.key, title)} />
          </div>
        );
      })}
    </div>
  );
}

function AddForm({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (value.trim()) { onAdd(value); setValue(""); } }}
      className="flex gap-2"
      style={{ marginTop: "var(--space-12)" }}
    >
      <input className="input" placeholder="Add a card…" value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="submit" className="btn btn-sm btn-primary">Add</button>
    </form>
  );
}
