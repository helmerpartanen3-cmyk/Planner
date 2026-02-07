"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Plus,
  X,
  Trash,
  PushPin,
  PushPinSlash,
  MagnifyingGlass,
  Notepad,
  Tag,
  DotsThree,
  ArrowsOutSimple,
  TextAa,
} from "@phosphor-icons/react";
import { APP_COLORS } from "../types";
import type { Note } from "../types";

interface Props {
  notes: Note[];
  onNotesChange: (notes: Note[]) => void;
}

const TAG_SUGGESTIONS = ["personal", "work", "ideas", "todo", "important", "reference", "journal"];

export default function NotesView({ notes, onNotesChange }: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", color: APP_COLORS[0], tags: [] as string[] });
  const [tagInput, setTagInput] = useState("");

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = notes;
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterTag) {
      list = list.filter((n) => n.tags?.includes(filterTag));
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, search, filterTag]);

  const addNote = useCallback(() => {
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
        tags: form.tags.length > 0 ? form.tags : undefined,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setForm({ title: "", content: "", color: APP_COLORS[0], tags: [] });
    setAdding(false);
  }, [form, notes, onNotesChange]);

  const deleteNote = useCallback(
    (id: string) => {
      onNotesChange(notes.filter((n) => n.id !== id));
      if (editingId === id) setEditingId(null);
      if (expandedId === id) setExpandedId(null);
    },
    [notes, onNotesChange, editingId, expandedId]
  );

  const togglePin = useCallback(
    (id: string) => {
      onNotesChange(
        notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n))
      );
    },
    [notes, onNotesChange]
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      onNotesChange(
        notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
      );
    },
    [notes, onNotesChange]
  );

  const addTagToNote = useCallback(
    (noteId: string, tag: string) => {
      const t = tag.trim().toLowerCase();
      if (!t) return;
      const note = notes.find((n) => n.id === noteId);
      if (!note || note.tags?.includes(t)) return;
      updateNote(noteId, { tags: [...(note.tags || []), t] });
    },
    [notes, updateNote]
  );

  const removeTagFromNote = useCallback(
    (noteId: string, tag: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      updateNote(noteId, { tags: (note.tags || []).filter((t) => t !== tag) });
    },
    [notes, updateNote]
  );

  const addFormTag = useCallback(
    (tag: string) => {
      const t = tag.trim().toLowerCase();
      if (t && !form.tags.includes(t)) {
        setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
      }
      setTagInput("");
    },
    [form.tags]
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const pinnedCount = notes.filter((n) => n.pinned).length;

  return (
    <div className="flex h-full gap-4 p-6 overflow-hidden">
      {/* Main column */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-white/90 text-gradient">Notes</h1>
            <p className="text-[13px] text-white/40 mt-0.5">
              {notes.length} note{notes.length !== 1 ? "s" : ""} · {pinnedCount} pinned
            </p>
          </div>
          <button
            onClick={() => setAdding((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 press-effect ${
              adding
                ? "bg-white/[0.08] text-white/60"
                : "bg-[#528BFF]/15 text-[#528BFF] hover:bg-[#528BFF]/25"
            }`}
          >
            {adding ? <X size={14} weight="light" /> : <Plus size={14} weight="light" />}
            {adding ? "Cancel" : "New Note"}
          </button>
        </div>

        {/* Search + tag filter */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] rounded-xl bg-white/5 border border-white/8 text-white/80 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
            />
          </div>
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                !filterTag ? "bg-white/12 text-white/70" : "bg-white/4 text-white/30 hover:bg-white/8"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                  filterTag === tag ? "bg-white/12 text-white/70" : "bg-white/4 text-white/30 hover:bg-white/8"
                }`}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Add note form */}
        {adding && (
          <div className="glass-card-static p-5 animate-modal space-y-3">
            <div className="text-[13px] font-semibold text-white/70">New Note</div>
            <input
              type="text"
              placeholder="Title..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-[13px] font-medium rounded-xl bg-white/5 border border-white/8 text-white/90 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
              autoFocus
            />
            <textarea
              placeholder="Write something..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 text-[13px] rounded-xl bg-white/5 border border-white/8 text-white/80 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors resize-none min-h-[80px]"
              rows={3}
            />
            {/* Tags */}
            <div>
              <div className="text-[11px] text-white/35 mb-1.5 font-medium flex items-center gap-1">
                <Tag size={10} /> Tags
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((t) => (
                  <span key={t} className="badge flex items-center gap-1">
                    {t}
                    <button onClick={() => setForm((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }))}>
                      <X size={8} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      addFormTag(tagInput);
                    }
                  }}
                  placeholder="Add tag..."
                  className="bg-transparent text-[11px] text-white/50 placeholder:text-white/20 outline-none w-20"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {TAG_SUGGESTIONS.filter((s) => !form.tags.includes(s))
                  .slice(0, 5)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => addFormTag(s)}
                      className="px-2 py-0.5 rounded-md bg-white/4 text-[10px] text-white/25 hover:bg-white/8 hover:text-white/40 transition-all"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>
            {/* Color picker */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {APP_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-5 h-5 rounded-md transition-all ${
                      form.color === c ? "scale-110 ring-2 ring-white/30" : "opacity-50 hover:opacity-80"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                onClick={addNote}
                disabled={!form.title.trim() && !form.content.trim()}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white press-effect transition-expo disabled:opacity-30"
                style={{ background: "var(--accent)" }}
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !adding && (
          <div className="glass-card-static p-8 text-center animate-modal">
            <Notepad size={32} weight="duotone" className="text-white/15 mx-auto mb-3" />
            <div className="text-[14px] font-semibold text-white/50 mb-1">
              {search || filterTag ? "No matching notes" : "No notes yet"}
            </div>
            <div className="text-[12px] text-white/25">
              {search || filterTag ? "Try a different search or filter" : "Capture your thoughts and ideas"}
            </div>
          </div>
        )}

        {/* Notes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note, idx) => {
            const isEditing = editingId === note.id;
            const isExpanded = expandedId === note.id;

            return (
              <div
                key={note.id}
                className={`glass-card group relative overflow-hidden transition-expo ${
                  isExpanded ? "col-span-1 sm:col-span-2 lg:col-span-3 row-span-2" : ""
                }`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Color accent */}
                <div className="h-[2px] rounded-t-xl" style={{ background: `${note.color}40` }} />

                <div className={`p-4 ${isExpanded ? "p-5" : ""}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={note.title}
                        onChange={(e) => updateNote(note.id, { title: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingId(null)}
                        className="flex-1 text-[14px] font-semibold bg-transparent border-none p-0 text-white/85 outline-none"
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-[14px] font-semibold text-white/80 truncate cursor-pointer flex-1 hover:text-white/90 transition-colors"
                        onClick={() => setEditingId(note.id)}
                      >
                        {note.pinned && <PushPin size={10} weight="fill" className="inline mr-1.5 text-white/30" />}
                        {note.title}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : note.id)}
                        className="p-1 rounded-md hover:bg-white/8 text-white/20 hover:text-white/50 transition-all"
                      >
                        <ArrowsOutSimple size={12} />
                      </button>
                      <button
                        onClick={() => togglePin(note.id)}
                        className="p-1 rounded-md hover:bg-white/8 text-white/20 hover:text-white/50 transition-all"
                      >
                        {note.pinned ? <PushPinSlash size={12} /> : <PushPin size={12} />}
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded-md hover:bg-white/8 text-white/20 hover:text-red-400 transition-all"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  {isEditing ? (
                    <textarea
                      value={note.content}
                      onChange={(e) => updateNote(note.id, { content: e.target.value })}
                      className={`w-full text-[12px] bg-transparent border-none p-0 text-white/50 resize-none outline-none ${
                        isExpanded ? "min-h-[200px]" : "min-h-[60px]"
                      }`}
                      rows={isExpanded ? 8 : 3}
                    />
                  ) : (
                    <p
                      className={`text-[12px] text-white/35 leading-relaxed cursor-pointer ${
                        isExpanded ? "" : "line-clamp-4"
                      }`}
                      onClick={() => setEditingId(note.id)}
                    >
                      {note.content || "Empty note — click to edit"}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {note.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-0.5"
                          style={{ background: `${note.color}12`, color: `${note.color}90` }}
                        >
                          {t}
                          {isEditing && (
                            <button onClick={() => removeTagFromNote(note.id, t)} className="hover:text-red-400">
                              <X size={7} />
                            </button>
                          )}
                        </span>
                      ))}
                      {isEditing && (
                        <input
                          type="text"
                          placeholder="+ tag"
                          className="bg-transparent text-[10px] text-white/30 placeholder:text-white/15 outline-none w-12"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                              addTagToNote(note.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] text-white/20">{formatDate(note.updatedAt)}</span>
                    <span className="text-[10px] text-white/15">
                      {note.content.length > 0 ? `${note.content.split(/\s+/).filter(Boolean).length} words` : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel - stats */}
      <div className="w-56 flex flex-col gap-3 shrink-0 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="glass-card-static p-4 animate-modal">
          <div className="text-[12px] font-semibold text-white/50 mb-3 flex items-center gap-1.5">
            <TextAa size={13} weight="bold" />
            Overview
          </div>
          <div className="space-y-3">
            {[
              { label: "Total Notes", value: notes.length },
              { label: "Pinned", value: pinnedCount },
              { label: "With Tags", value: notes.filter((n) => n.tags && n.tags.length > 0).length },
              { label: "Total Words", value: notes.reduce((sum, n) => sum + n.content.split(/\s+/).filter(Boolean).length, 0) },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-[11px] text-white/30">{s.label}</span>
                <span className="text-[13px] font-bold text-white/70 stat-number">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tag cloud */}
        {allTags.length > 0 && (
          <div className="glass-card-static p-4 animate-modal" style={{ animationDelay: "50ms" }}>
            <div className="text-[12px] font-semibold text-white/50 mb-3 flex items-center gap-1.5">
              <Tag size={13} weight="bold" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const count = notes.filter((n) => n.tags?.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                      filterTag === tag ? "bg-white/12 text-white/70" : "bg-white/4 text-white/30 hover:bg-white/8"
                    }`}
                  >
                    {tag}
                    <span className="text-[9px] text-white/20">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="glass-card-accent p-4 animate-modal" style={{ animationDelay: "100ms" }}>
          <div className="text-[12px] font-semibold text-white/50 mb-2">Quick Tip</div>
          <p className="text-[11px] text-white/30 leading-relaxed">
            Add tags to organize your notes into categories. Click on any tag to filter your collection instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
