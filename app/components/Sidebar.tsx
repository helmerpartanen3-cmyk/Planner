"use client";

import { useRef, useState, useEffect } from "react";
import {
  CalendarBlank,
  Check,
  CalendarDot,
  CloudSun,
  Lightning,
  Notepad,
  Timer,
  CheckSquare,
} from "@phosphor-icons/react";
import type { ViewType } from "../types";

export const DEFAULT_NAV_ORDER: ViewType[] = [
  "today",
  "calendar",
  "tasks",
  "habits",
  "notes",
  "focus",
  "weather",
];

interface NavSection {
  items: ViewType[];
}

const NAV_META: Record<
  ViewType,
  { label: string; icon: typeof CalendarDot }
> = {
  today: { label: "Today", icon: CalendarDot },
  calendar: { label: "Calendar", icon: CalendarBlank },
  tasks: { label: "Tasks", icon: CheckSquare },
  habits: { label: "Habits", icon: Lightning },
  notes: { label: "Notes", icon: Notepad },
  focus: { label: "Focus", icon: Timer },
  weather: { label: "Weather", icon: CloudSun },
};

const SECTIONS: NavSection[] = [
  { items: ["today", "calendar", "tasks"] },
  { items: ["habits", "notes", "focus"] },
  { items: ["weather"] },
];

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  navOrder: ViewType[];
  onNavOrderChange: (order: ViewType[]) => void;
  isWeather?: boolean;
}

export default function Sidebar({
  currentView,
  onViewChange,
  navOrder,
  onNavOrderChange,
  isWeather = false,
}: SidebarProps) {
  const today = new Date();
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    top: 0,
    height: 0,
    opacity: 0,
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNode = useRef<HTMLButtonElement | null>(null);

  // Measure active button position for sliding indicator
  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeBtn = navRef.current.querySelector(
        `[data-view="${currentView}"]`
      ) as HTMLElement | null;
      if (activeBtn) {
        const navRect = navRef.current.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        setIndicatorStyle({
          top: btnRect.top - navRect.top,
          height: btnRect.height,
          opacity: 1,
        });
      }
    };
    updateIndicator();
    // Also update on resize
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [currentView, navOrder]);

  /* drag handlers */
  const handleDragStart = (
    idx: number,
    e: React.DragEvent<HTMLButtonElement>
  ) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.35";
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

  // Build ordered items based on sections (respects custom order for items within sections)
  const orderedItems = navOrder;

  return (
    <aside
      className={`w-[220px] h-full flex flex-col border-r select-none shrink-0 transition-colors duration-300 ${
        isWeather
          ? "border-white/[0.04] bg-black/15"
          : "border-white/[0.06] bg-black/15"
      }`}
    >
      {/* Drag area + branding */}
      <div
        className="h-9 flex items-center px-5 shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-[11px] font-semibold text-white/40 tracking-[0.2em] uppercase">
          Clarity
        </span>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 px-3 pt-1 relative">
        {/* Animated active indicator */}
        <div
          className="absolute left-3 right-3 rounded-lg bg-white/[0.07] pointer-events-none z-0"
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            opacity: indicatorStyle.opacity,
            transition:
              "top 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s ease, opacity 0.15s ease",
          }}
        />

        {orderedItems.map((id, idx) => {
          const meta = NAV_META[id];
          if (!meta) return null;
          const active = currentView === id;
          const isDropTarget =
            overIdx === idx && dragIdx !== null && dragIdx !== idx;

          // Add section separator
          const showSeparator =
            idx > 0 &&
            SECTIONS.some(
              (s) =>
                s.items[0] === id &&
                !s.items.includes(orderedItems[idx - 1])
            );

          return (
            <div key={id}>
              {showSeparator && (
                <div className="my-1.5 mx-2 h-px bg-white/[0.04]" />
              )}
              <button
                data-view={id}
                draggable
                onDragStart={(e) => handleDragStart(idx, e)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(idx, e)}
                onDragEnter={(e) => e.preventDefault()}
                onClick={() => onViewChange(id)}
                className={`
                  relative z-[1] w-full flex items-center gap-3 px-3 py-[7px] rounded-lg
                  text-[13px] cursor-grab active:cursor-grabbing
                  transition-colors duration-150
                  ${
                    active
                      ? "text-white/90"
                      : "text-white/40 hover:text-white/60"
                  }
                  ${
                    isDropTarget
                      ? "border-t border-blue-400/40"
                      : "border-t border-transparent"
                  }
                `}
              >
                <meta.icon
                  size={17}
                  weight={active ? "regular" : "light"}
                  className="transition-all duration-200"
                />
                <span className="font-medium">{meta.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer date */}
      <div className="px-5 py-4 text-[11px] text-white/20">
        {today.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>
    </aside>
  );
}
