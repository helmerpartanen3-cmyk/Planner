"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  CalendarBlank,
  CalendarDot,
  CloudSun,
  Lightning,
  Notepad,
  Timer,
  CheckSquare,
  Target,
  Plus,
  MagnifyingGlass,
  ArrowRight,
} from "@phosphor-icons/react";
import type { ViewType } from "../../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  onQuickAdd: (type: "task" | "event" | "note" | "habit") => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onQuickAdd,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-today",
        label: "Go to Today",
        icon: <CalendarDot size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("today"); onClose(); },
        keywords: ["home", "dashboard", "overview"],
      },
      {
        id: "nav-calendar",
        label: "Go to Calendar",
        icon: <CalendarBlank size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("calendar"); onClose(); },
        keywords: ["events", "schedule"],
      },
      {
        id: "nav-tasks",
        label: "Go to Tasks",
        icon: <CheckSquare size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("tasks"); onClose(); },
        keywords: ["todo", "to-do"],
      },
      {
        id: "nav-habits",
        label: "Go to Habits",
        icon: <Lightning size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("habits"); onClose(); },
        keywords: ["routine", "streak"],
      },
      {
        id: "nav-notes",
        label: "Go to Notes",
        icon: <Notepad size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("notes"); onClose(); },
        keywords: ["write", "memo"],
      },
      {
        id: "nav-focus",
        label: "Go to Focus",
        icon: <Timer size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("focus"); onClose(); },
        keywords: ["pomodoro", "timer", "concentrate"],
      },
      {
        id: "nav-goals",
        label: "Go to Goals",
        icon: <Target size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("goals"); onClose(); },
        keywords: ["milestones", "objectives"],
      },
      {
        id: "nav-weather",
        label: "Go to Weather",
        icon: <CloudSun size={16} weight="regular" />,
        category: "Navigation",
        action: () => { onNavigate("weather"); onClose(); },
        keywords: ["forecast"],
      },
      // Quick actions
      {
        id: "add-task",
        label: "New Task",
        description: "Create a new task",
        icon: <Plus size={16} weight="regular" className="text-blue-400" />,
        category: "Quick Actions",
        action: () => { onQuickAdd("task"); onClose(); },
        keywords: ["create", "add", "todo"],
      },
      {
        id: "add-event",
        label: "New Event",
        description: "Create a calendar event",
        icon: <Plus size={16} weight="regular" className="text-green-400" />,
        category: "Quick Actions",
        action: () => { onQuickAdd("event"); onClose(); },
        keywords: ["create", "add", "calendar", "schedule"],
      },
      {
        id: "add-note",
        label: "New Note",
        description: "Create a new note",
        icon: <Plus size={16} weight="regular" className="text-purple-400" />,
        category: "Quick Actions",
        action: () => { onQuickAdd("note"); onClose(); },
        keywords: ["create", "add", "write"],
      },
      {
        id: "add-habit",
        label: "New Habit",
        description: "Start tracking a new habit",
        icon: <Plus size={16} weight="regular" className="text-teal-400" />,
        category: "Quick Actions",
        action: () => { onQuickAdd("habit"); onClose(); },
        keywords: ["create", "add", "routine"],
      },
    ],
    [onNavigate, onClose, onQuickAdd]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.includes(q)) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  const flatItems = filtered;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) flatItems[selectedIndex].action();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatItems, selectedIndex, onClose]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let itemIdx = -1;

  return (
    <div
      className="fixed bg-black/30 inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[520px] max-h-[400px] rounded-2xl border border-white/[0.08] bg-neutral-800 shadow-lg overflow-hidden animate-modal"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <MagnifyingGlass size={16} weight="regular" className="text-white/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-[14px] !bg-transparent !border-none !ring-0 !outline-none !shadow-none text-white/90 placeholder:text-white/25"
          />
          <kbd className="text-[10px] text-white/20 bg-white/[0.05] px-2 py-1 rounded-md font-medium shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2">
          {flatItems.length === 0 && (
            <div className="text-center py-10">
              <p className="text-[13px] text-white/20">No results found</p>
            </div>
          )}

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-1">
              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.1em] px-3 py-1.5">
                {category}
              </p>
              {items.map((item) => {
                itemIdx++;
                const isSelected = selectedIndex === itemIdx;
                const currentIdx = itemIdx;

                return (
                  <button
                    key={item.id}
                    data-index={currentIdx}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(currentIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-100 ${
                      isSelected
                        ? "bg-white/[0.07] text-white/90"
                        : "text-white/55 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className={`shrink-0 ${isSelected ? "text-white/60" : "text-white/30"}`}>
                      {item.icon}
                    </span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[13px] font-medium truncate">{item.label}</p>
                      {item.description && (
                        <p className="text-[11px] text-white/25 truncate">{item.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <ArrowRight size={13} weight="regular" className="text-white/30 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
