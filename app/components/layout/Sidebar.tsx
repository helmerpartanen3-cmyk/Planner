"use client";

import { useRef, useState, useEffect } from "react";
import { Command } from "@phosphor-icons/react";
import type { ViewType } from "../../types";
import { NAV_META, SECTIONS } from "../../config";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  navOrder: ViewType[];
  onNavOrderChange: (order: ViewType[]) => void;
  isWeather?: boolean;
  onCommandPalette?: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  navOrder,
  onNavOrderChange,
  isWeather = false,
  onCommandPalette,
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
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [currentView, navOrder]);

  const handleDragStart = (
    idx: number,
    e: React.DragEvent<HTMLButtonElement>
  ) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.3";
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

  const orderedItems = navOrder;

  return (
    <aside
      className={`w-[228px] h-full flex flex-col border-r select-none shrink-0 transition-colors duration-300 ${
        isWeather
          ? "border-white/[0.03] bg-black/20 backdrop-blur-lg"
          : "border-white/[0.05] bg-black/12"
      }`}
    >
      {/* Drag area + branding */}
      <div
        className="h-9 flex items-center px-5 shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        </div>
      {/* Quick action - Command Palette */}
      <div className="px-3 mb-1">
        <button
          onClick={onCommandPalette}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all duration-200 group"
        >
          <Command size={13} weight="regular" className="text-white/25 group-hover:text-white/40 transition-colors" />
          <span className="text-[11px] text-white/25 group-hover:text-white/35 transition-colors flex-1 text-left">
            Quick actions
          </span>
          <kbd className="text-[9px] text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded font-medium">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 px-3 pt-2 relative overflow-y-auto">
        {/* Animated active indicator */}
        <div
          className="absolute left-3 right-3 rounded-xl pointer-events-none z-0"
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            opacity: indicatorStyle.opacity,
            background: "rgba(255, 255, 255, 0.055)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            transition:
              "top 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s ease, opacity 0.15s ease",
          }}
        />

        {orderedItems.map((id, idx) => {
          const meta = NAV_META[id];
          if (!meta) return null;
          const active = currentView === id;
          const isDropTarget =
            overIdx === idx && dragIdx !== null && dragIdx !== idx;

          const showSeparator =
            idx > 0 &&
            SECTIONS.some(
              (s) =>
                s.items[0] === id &&
                !s.items.includes(orderedItems[idx - 1])
            );

          const section = showSeparator
            ? SECTIONS.find((s) => s.items[0] === id)
            : null;

          return (
            <div key={id}>
              {showSeparator && (
                <div className="mt-3 mb-1.5 px-3">
                  {section && (
                    <span className="text-[9px] font-semibold text-white/15 uppercase tracking-[0.15em]">
                      {section.label}
                    </span>
                  )}
                </div>
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
                  relative z-[1] w-full flex items-center gap-3 px-3 py-[8px] rounded-xl
                  text-[13px] cursor-grab active:cursor-grabbing
                  transition-all duration-200
                  ${active ? "text-white/90" : "text-white/35 hover:text-white/55"}
                  ${isDropTarget ? "border-t border-blue-400/30" : "border-t border-transparent"}
                `}
              >
                <meta.icon
                  size={17}
                  weight={active ? "regular" : "light"}
                  className="transition-all duration-200"
                  style={active ? { color: meta.accent } : undefined}
                />
                <span className="font-medium">{meta.label}</span>
                {active && (
                  <div
                    className="ml-auto w-1 h-1 rounded-full"
                    style={{ background: meta.accent }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer date */}
      <div className="px-5 py-4 border-t border-white/[0.04]">
        <p className="text-[10px] text-white/20 font-medium">
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </aside>
  );
}
