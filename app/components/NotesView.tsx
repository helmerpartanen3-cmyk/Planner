"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  X,
  Trash,
  PushPin,
  PushPinSlash,
  MagnifyingGlass,
  Notepad,
} from "@phosphor-icons/react";
import type { Note } from "../types";

const NOTE_COLORS = ["#528BFF", "#34D399", "#A78BFA", "#FB923C", "#F87171", "#2DD4BF"];

interface Props {
  notes: Note[];
  onNotesChange: (notes: Note[]) => void;
}

export default function NotesView({ notes, onNotesChange }: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    color: NOTE_COLORS[0],
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        )
      : notes;
    // Pinned first, then by date
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, search]);

  const addNote = () => {
    if (!form.title.trim() && !form.content.trim()) return;
    const now = new Date().toISOString();
    onNotesChange([
      ...notes,
      {
        id: Date.now().toString(),
        title: form.title.trim() || "Untitled",
        content: form.content.trim(),
        color: form.color,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setForm({ title: "", content: "", color: NOTE_COLORS[0] });
    setAdding(false);
  };

  const deleteNote = (id: string) => {
    onNotesChange(notes.filter((n) => n.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const togglePin = (id: string) => {
    onNotesChange(
      notes.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    onNotesChange(
      notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="h-full overflow-y-auto p-6 animate-viewEnter">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white/90">Notes</h2>
            <p className="text-[12px] text-white/30 mt-0.5">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </p>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              adding
                ? "bg-white/[0.08] text-white/60"
                : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
            }`}
          >
            {adding ? <X size={15} weight="light" /> : <Plus size={15} weight="light" />}
          </button>
        </div>

        {/* Search */}
        {notes.length > 0 && (
          <div className="relative mb-5">
            <MagnifyingGlass
              size={14}
              weight="light"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] rounded-full"
            />
          </div>
        )}

        {/* Add note form */}
        {adding && (
          <div className="mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3 animate-slideDown">
            <input
              type="text"
              placeholder="Title..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-[13px] rounded-full font-medium"
              autoFocus
            />
            <textarea
              placeholder="Write something..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 text-[13px] rounded-2xl resize-none min-h-[80px]"
              rows={3}
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-4 h-4 rounded-full transition-all ${
                      form.color === c
                        ? "ring-[1.5px] ring-white/40 scale-110"
                        : "opacity-40 hover:opacity-80"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex-1" />
              <button
                onClick={addNote}
                disabled={!form.title.trim() && !form.content.trim()}
                className="px-4 py-1.5 text-[12px] rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-default transition-all font-medium"
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        {/* Notes grid */}
        {filtered.length === 0 && !adding && (
          <div className="text-center mt-20">
            <Notepad size={32} weight="light" className="text-white/10 mx-auto mb-3" />
            <p className="text-[13px] text-white/20">
              {search ? "No matching notes" : "No notes yet"}
            </p>
            <p className="text-[11px] text-white/15 mt-1">
              {search ? "Try a different search term" : "Click + to create your first note"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((note, idx) => {
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                className="group rounded-2xl border border-white/[0.06] overflow-hidden transition-all duration-200 hover:border-white/[0.10] card-hover stagger-item"
                style={{
                  "--i": idx,
                  background: note.color + "08",
                } as React.CSSProperties}
              >
                {/* Color accent line */}
                <div className="h-[2px]" style={{ background: note.color + "30" }} />

                <div className="p-5">
                  {/* Title */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) => updateNote(note.id, { title: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                      className="w-full text-[13px] font-semibold mb-2 !bg-transparent !border-none !p-0 text-white/85"
                      autoFocus
                    />
                  ) : (
                    <p
                      className="text-[14px] font-semibold text-white/80 mb-2 truncate cursor-pointer"
                      onClick={() => setEditingId(note.id)}
                    >
                      {note.pinned && (
                        <PushPin
                          size={10}
                          weight="fill"
                          className="inline mr-1.5 text-white/30"
                        />
                      )}
                      {note.title}
                    </p>
                  )}

                  {/* Content preview */}
                  {isEditing ? (
                    <textarea
                      value={note.content}
                      onChange={(e) => updateNote(note.id, { content: e.target.value })}
                      className="w-full text-[12px] !bg-transparent !border-none !p-0 text-white/50 resize-none min-h-[60px]"
                      rows={3}
                    />
                  ) : (
                    <p
                      className="text-[12px] text-white/35 line-clamp-3 cursor-pointer leading-relaxed"
                      onClick={() => setEditingId(note.id)}
                    >
                      {note.content || "Empty note"}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-white/20">
                      {formatDate(note.updatedAt)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => togglePin(note.id)}
                        className="p-1 rounded-md hover:bg-white/[0.08] text-white/25 hover:text-white/50 transition-all"
                        title={note.pinned ? "Unpin" : "Pin"}
                      >
                        {note.pinned ? (
                          <PushPinSlash size={12} weight="light" />
                        ) : (
                          <PushPin size={12} weight="light" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded-md hover:bg-white/[0.08] text-white/25 hover:text-red-400 transition-all"
                      >
                        <Trash size={12} weight="light" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
