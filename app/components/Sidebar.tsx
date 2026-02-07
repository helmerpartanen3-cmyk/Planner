"use client";

import { useRef, useState } from "react";
import { CalendarBlank, CheckSquare, Sun, CalendarDot  } from "@phosphor-icons/react";
import type { ViewType } from "../types";

export const DEFAULT_NAV_ORDER: ViewType[] = ["today", "calendar", "tasks"];

const NAV_META: Record<ViewType, { label: string; icon: typeof Sun }> = {
  today: { label: "Today", icon: CalendarDot  },
  calendar: { label: "Calendar", icon: CalendarBlank },
  tasks: { label: "Tasks", icon: CheckSquare },
};

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  navOrder: ViewType[];
  onNavOrderChange: (order: ViewType[]) => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  navOrder,
  onNavOrderChange,
}: SidebarProps) {
  const today = new Date();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNode = useRef<HTMLButtonElement | null>(null);

  const handleDragStart = (idx: number, e: React.DragEvent<HTMLButtonElement>) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    });
  };

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const next = [...navOrder];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(overIdx, 0, moved);
      onNavOrderChange(next);
    }
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIdx !== idx) setOverIdx(idx);
  };

  return (
    <aside className="w-56 h-full flex flex-col border-r border-white/[0.06] select-none shrink-0">
      {/* Drag area + branding */}
      <div
        className="h-9 flex items-center px-5 shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-[11px] font-semibold text-white/50 tracking-[0.2em] uppercase">
          Clarity
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2 space-y-0.5">
        {navOrder.map((id, idx) => {
          const meta = NAV_META[id];
          const active = currentView === id;
          const isDropTarget = overIdx === idx && dragIdx !== null && dragIdx !== idx;

          return (
            <button
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(idx, e)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(idx, e)}
              onDragEnter={(e) => e.preventDefault()}
              onClick={() => onViewChange(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-[7px] rounded-lg
                text-[13px] transition-all duration-150 cursor-grab active:cursor-grabbing
                ${
                  active
                    ? "bg-white/[0.07] text-white/90"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/65"
                }
                ${isDropTarget ? "border-t border-blue-400/40" : "border-t border-transparent"}
              `}
            >
              <meta.icon
                size={17}
                weight={active ? "regular" : "light"}
              />
              {meta.label}
            </button>
          );
        })}
      </nav>

      {/* Footer date */}
      <div className="px-5 py-4 text-[11px] text-white/25">
        {today.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>
    </aside>
  );
}
