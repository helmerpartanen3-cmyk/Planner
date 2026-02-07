"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  CaretLeft,
  CaretRight,
  Plus,
  Clock,
  Trash,
  X,
} from "@phosphor-icons/react";
import { APP_COLORS } from "../../config";
import type { CalendarEvent } from "../../types";
import {
  DAYS_SHORT,
  DAYS_NARROW,
  MONTHS,
  MONTHS_SHORT,
  EVENT_COLORS,
  HOURS,
  HOUR_HEIGHT,
} from "./constants";

type CalMode = "day" | "week" | "month" | "year";

interface Props {
  events: CalendarEvent[];
  onEventsChange: (events: CalendarEvent[]) => void;
}

/* ── date helpers ────────────────────────────────────── */

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOffset(y: number, m: number) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function fmtDate(d: Date) {
  return fmt(d.getFullYear(), d.getMonth(), d.getDate());
}
function isToday(y: number, m: number, d: number) {
  const t = new Date();
  return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
}
function isTodayDate(d: Date) {
  return isToday(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function addDays(d: Date, n: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}
function timeToY(time: string | undefined) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
}

/* ── overlap layout (column-packing) ─────────────────── */

interface LayoutSlot {
  event: CalendarEvent;
  col: number;
  totalCols: number;
}

function layoutOverlappingEvents(evts: CalendarEvent[]): LayoutSlot[] {
  if (evts.length === 0) return [];

  const sorted = [...evts].sort((a, b) => {
    const cmp = (a.startTime || "00:00").localeCompare(b.startTime || "00:00");
    if (cmp !== 0) return cmp;
    return (a.endTime || "23:59").localeCompare(b.endTime || "23:59");
  });

  // group into overlapping clusters
  const clusters: CalendarEvent[][] = [];
  let cur: CalendarEvent[] = [];
  let clusterEnd = 0;

  for (const ev of sorted) {
    const sY = timeToY(ev.startTime);
    const eY = Math.max(timeToY(ev.endTime), sY + 20);
    if (cur.length === 0 || sY < clusterEnd) {
      cur.push(ev);
      clusterEnd = Math.max(clusterEnd, eY);
    } else {
      clusters.push(cur);
      cur = [ev];
      clusterEnd = eY;
    }
  }
  if (cur.length > 0) clusters.push(cur);

  // assign columns within each cluster
  const result: LayoutSlot[] = [];
  for (const cluster of clusters) {
    const colEnds: number[] = []; // track each column's end-Y
    const assignments: { event: CalendarEvent; col: number }[] = [];

    for (const ev of cluster) {
      const sY = timeToY(ev.startTime);
      let col = -1;
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= sY) { col = c; break; }
      }
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(0);
      }
      colEnds[col] = Math.max(timeToY(ev.endTime), sY + 20);
      assignments.push({ event: ev, col });
    }

    const totalCols = colEnds.length;
    for (const a of assignments) {
      result.push({ event: a.event, col: a.col, totalCols });
    }
  }
  return result;
}

/* ── main component ──────────────────────────────────── */

export default function CalendarView({ events, onEventsChange }: Props) {
  const now = new Date();
  const [mode, setMode] = useState<CalMode>("week");
  const [cursor, setCursor] = useState(new Date(now));
  const [selected, setSelected] = useState(fmtDate(now));
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [miniMonth, setMiniMonth] = useState(new Date(now));
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    color: EVENT_COLORS[0],
  });

  /* scroll day/week timeline to ~7 AM on mount */
  const timelineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((mode === "day" || mode === "week") && timelineRef.current) {
      timelineRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, [mode]);

  /* ── navigation ────────────────────────────────── */

  const navigate = useCallback((dir: number) => {
    setCursor((d) => {
      const next = new Date(d);
      if (mode === "day") next.setDate(next.getDate() + dir);
      else if (mode === "week") next.setDate(next.getDate() + dir * 7);
      else if (mode === "month") next.setMonth(next.getMonth() + dir);
      else next.setFullYear(next.getFullYear() + dir);
      return next;
    });
  }, [mode]);

  const goToday = () => {
    const d = new Date();
    setCursor(d);
    setSelected(fmtDate(d));
    setMiniMonth(d);
  };

  const selectDate = (d: Date) => {
    setSelected(fmtDate(d));
    setCursor(d);
  };

  /* header label */
  const headerLabel = useMemo(() => {
    if (mode === "day")
      return cursor.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    if (mode === "week") {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth()) {
        return `${MONTHS[ws.getMonth()]} ${ws.getFullYear()}`;
      }
      if (ws.getFullYear() === we.getFullYear()) {
        return `${MONTHS_SHORT[ws.getMonth()]} – ${MONTHS_SHORT[we.getMonth()]} ${ws.getFullYear()}`;
      }
      return `${MONTHS_SHORT[ws.getMonth()]} ${ws.getFullYear()} – ${MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}`;
    }
    if (mode === "month")
      return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    return `${cursor.getFullYear()}`;
  }, [mode, cursor]);

  /* CRUD */
  const addEvent = () => {
    if (!form.title.trim()) return;
    onEventsChange([
      ...events,
      {
        id: Date.now().toString(),
        title: form.title.trim(),
        date: selected,
        startTime: form.startTime,
        endTime: form.endTime,
        color: form.color,
        description: "",
      },
    ]);
    setForm({ title: "", startTime: "09:00", endTime: "10:00", color: EVENT_COLORS[0] });
    setAdding(false);
  };
  const delEvent = (id: string) =>
    onEventsChange(events.filter((e) => e.id !== id));

  /* selected day events */
  const selEvents = events
    .filter((e) => e.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const [sY, sM, sD] = selected.split("-").map(Number);
  const selDate = new Date(sY, sM - 1, sD);

  /* ── render ────────────────────────────────────── */

  return (
    <div className="flex h-full">
      {/* ── left sidebar: mini calendar + day detail ── */}
      <div className="w-60 flex flex-col shrink-0">
        {/* Mini calendar */}
        <div className="px-4 pt-4 pb-2">
          <MiniCalendar
            month={miniMonth}
            onMonthChange={setMiniMonth}
            selected={selected}
            events={events}
            onSelect={(d) => {
              selectDate(d);
              setMiniMonth(d);
            }}
          />
        </div>

        {/* Selected day detail */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-white/80">
                {selDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
            <button
              onClick={() => setAdding(!adding)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 press-effect ${
                adding
                  ? "bg-white/[0.08] text-white/60"
                  : "bg-[#528BFF]/15 text-[#528BFF] hover:bg-[#528BFF]/25"
              }`}
            >
              {adding ? <X size={14} weight="regular" /> : <Plus size={14} weight="regular" />}
              {adding ? "Cancel" : "New Event"}
            </button>
          </div>

          {/* Quick add form */}
          {adding && (
            <div className="px-4 pb-3 space-y-2">
              <input
                type="text"
                placeholder="Event title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEvent()}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[13px] text-white/90 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
                autoFocus
              />
              <div className="flex gap-1.5 items-center">
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="flex-1 px-3 py-2 text-[13px] rounded-xl bg-white/5 border border-white/8 text-white/70 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
                />
                <span className="text-[10px] text-white/20">→</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="flex-1 px-3 py-2 text-[13px] rounded-xl bg-white/5 border border-white/8 text-white/70 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
                />
              </div>
              <div className="flex gap-1 items-center">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-4 h-4 rounded-full transition-all ${
                      form.color === c ? "ring-[1.5px] ring-white/40 scale-110" : "opacity-40 hover:opacity-80"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                onClick={addEvent}
                disabled={!form.title.trim()}
                className="w-full py-1.5 text-[11px] rounded-md bg-[#528BFF]/20 text-[#528BFF] hover:bg-[#528BFF]/30 disabled:opacity-25 disabled:cursor-default transition-all font-medium"
              >
                Add Event
              </button>
            </div>
          )}

          {/* Event list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
            {selEvents.length === 0 ? (
              <p className="text-[12px] text-white/15 text-center mt-8">
                No events
              </p>
            ) : (
              selEvents.map((ev) => (
                <div
                  key={ev.id}
                  onMouseEnter={() => setEditingId(ev.id)}
                  onMouseLeave={() => setEditingId(null)}
                  className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all"
                  style={{ background: ev.color }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white font-medium truncate leading-tight">
                      {ev.title}
                    </p>
                    <p className="text-[10px] text-white/80 mt-0.5 flex items-center gap-1">
                      <Clock size={9} weight="regular" />
                      {ev.startTime} – {ev.endTime}
                    </p>
                  </div>
                  {editingId === ev.id && (
                    <button
                      onClick={() => delEvent(ev.id)}
                      className="p-1.5 rounded-md hover:bg-white/20 text-white/70 hover:text-white transition-all"
                    >
                      <Trash size={15} weight="regular" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── right: main calendar area ────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* toolbar */}
        <div className="flex items-center justify-between px-5 h-12 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => navigate(-1)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-white/35 hover:text-white/65 transition-all"
              >
                <CaretLeft size={14} weight="regular" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-white/35 hover:text-white/65 transition-all"
              >
                <CaretRight size={14} weight="regular" />
              </button>
            </div>
            <h2 className="text-[14px] font-semibold text-white/85 truncate">
              {headerLabel}
            </h2>
            <button
              onClick={goToday}
              className="text-[10px] px-2 py-0.5 rounded-md border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all"
            >
              Today
            </button>
          </div>

          <div className="flex items-center">
            <div className="flex rounded-xl bg-neutral-800 border border-white/[0.06] p-1">
              {(["day", "week", "month", "year"] as CalMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-[3px] text-xs rounded-lg capitalize transition-all font-light ${
                    mode === m
                      ? "bg-neutral-700 text-white/80 shadow-sm"
                      : "text-white/30 hover:text-white/50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* content area */}
        <div className="flex-1 overflow-hidden bg-neutral-800 rounded-4xl m-2 border border-white/[0.06]">
          {mode === "day" && (
            <DayView
              date={cursor}
              events={events}
              selected={selected}
              onSelect={selectDate}
              timelineRef={timelineRef}
            />
          )}
          {mode === "week" && (
            <WeekView
              cursor={cursor}
              events={events}
              selected={selected}
              onSelect={selectDate}
              timelineRef={timelineRef}
            />
          )}
          {mode === "month" && (
            <MonthView
              year={cursor.getFullYear()}
              month={cursor.getMonth()}
              events={events}
              selected={selected}
              onSelect={selectDate}
            />
          )}
          {mode === "year" && (
            <YearView
              year={cursor.getFullYear()}
              events={events}
              selected={selected}
              onSelect={(d) => {
                selectDate(d);
                setMode("month");
                setCursor(d);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MINI CALENDAR – compact month in left sidebar
   ══════════════════════════════════════════════════════ */

function MiniCalendar({
  month,
  onMonthChange,
  selected,
  events,
  onSelect,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selected: string;
  events: CalendarEvent[];
  onSelect: (d: Date) => void;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const dim = daysInMonth(y, m);
  const offset = firstDayOffset(y, m);

  const prevMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(d);
  };
  const nextMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(d);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-white/60">
          {MONTHS_SHORT[m]} {y}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-0.5 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-all"
          >
            <CaretLeft size={11} weight="bold" />
          </button>
          <button
            onClick={nextMonth}
            className="p-0.5 rounded hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-all"
          >
            <CaretRight size={11} weight="bold" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[1px]">
        {DAYS_NARROW.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-white/20 pb-1 font-medium">
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`b${i}`} />
        ))}
        {Array.from({ length: dim }, (_, i) => {
          const d = i + 1;
          const ds = fmt(y, m, d);
          const today = isToday(y, m, d);
          const sel = ds === selected;
          const hasEvents = events.some((e) => e.date === ds);

          return (
            <button
              key={d}
              onClick={() => onSelect(new Date(y, m, d))}
              className={`
                w-full aspect-square flex items-center justify-center rounded-full text-[10px] transition-all relative
                ${today ? "bg-[#528BFF] text-white font-semibold" : ""}
                ${sel && !today ? "bg-white/[0.08] text-white/90 font-medium" : ""}
                ${!today && !sel ? "text-white/45 hover:bg-white/[0.05]" : ""}
              `}
            >
              {d}
              {hasEvents && !today && (
                <span className="absolute bottom-[1px] w-[3px] h-[3px] rounded-full bg-[#528BFF]/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DAY VIEW – 24 h scrollable timeline
   ══════════════════════════════════════════════════════ */

function DayView({
  date,
  events,
  selected,
  onSelect,
  timelineRef,
}: {
  date: Date;
  events: CalendarEvent[];
  selected: string;
  onSelect: (d: Date) => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ds = fmtDate(date);
  const dayEvents = events
    .filter((e) => e.date === ds)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;

  return (
    <div ref={timelineRef} className="h-full overflow-y-auto">
      <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
        {/* hour rows */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute w-full flex"
            style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          >
            <span className="w-16 shrink-0 text-[10px] text-white/20 text-right pr-4 -mt-[6px]">
              {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </span>
            <div className="flex-1 border-t border-white/[0.04]" />
          </div>
        ))}

        {/* now indicator */}
        {isTodayDate(date) && (
          <div
            className="absolute left-16 right-0 z-10 pointer-events-none flex items-center"
            style={{ top: nowH * HOUR_HEIGHT }}
          >
            <div className="w-2 h-2 rounded-full bg-[#528BFF] -ml-1" />
            <div className="flex-1 h-[1.5px] bg-[#528BFF]/60" />
          </div>
        )}

        {/* events */}
        {layoutOverlappingEvents(dayEvents).map(({ event: ev, col, totalCols }) => {
          const top = timeToY(ev.startTime);
          const bot = timeToY(ev.endTime);
          const h = Math.max(bot - top, 22);
          const GAP = 2;
          const widthPct = `calc(${100 / totalCols}% - ${GAP}px)`;
          const leftPct = `calc(68px + ${col} * ((100% - 68px - 12px) / ${totalCols}) + ${GAP / 2}px)`;
          return (
            <button
              key={ev.id}
              onClick={() => onSelect(date)}
              className="absolute rounded-md px-3 py-1.5 text-left hover:brightness-110 transition-all z-[5] overflow-hidden"
              style={{
                top,
                height: h,
                left: leftPct,
                width: `calc((100% - 68px - 12px) / ${totalCols} - ${GAP}px)`,
                background: ev.color,
              }}
            >
              <p className="text-[11px] text-white font-medium truncate">
                {ev.title}
              </p>
              {h > 28 && (
                <p className="text-[9px] text-white/80 mt-0.5">
                  {ev.startTime} – {ev.endTime}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   WEEK VIEW – 7 columns × 24 h (Notion-style)
   ══════════════════════════════════════════════════════ */

function WeekView({
  cursor,
  events,
  selected,
  onSelect,
  timelineRef,
}: {
  cursor: Date;
  events: CalendarEvent[];
  selected: string;
  onSelect: (d: Date) => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ws = startOfWeek(cursor);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;

  return (
    <div className="flex flex-col h-full">
      {/* day column headers */}
      <div className="flex shrink-0">
        <div className="w-16 shrink-0" />
        {weekDates.map((d, i) => {
          const ds = fmtDate(d);
          const today = isTodayDate(d);
          const sel = ds === selected;
          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 hover:bg-white/[0.02] transition-all border-b border-white/[0.06]"
            >
              <span className={`text-[10px] uppercase font-medium ${today ? "text-[#528BFF]" : "text-white/25"}`}>
                {DAYS_SHORT[i]}
              </span>
              <span
                className={`text-xs w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                  today
                    ? "bg-[#528BFF] text-white font-semibold"
                    : sel
                    ? "bg-white/[0.07] text-white/85"
                    : "text-white/50 hover:bg-white/[0.04]"
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* scrollable grid */}
      <div ref={timelineRef} className="flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* time gutter */}
          <div className="w-16 shrink-0 relative">
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute text-[10px] text-white/20 text-right pr-4 w-16 -mt-[6px]"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </span>
            ))}
          </div>

          {/* columns */}
          {weekDates.map((d, ci) => {
            const ds = fmtDate(d);
            const dayEv = events
              .filter((e) => e.date === ds)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const today = isTodayDate(d);
            const sel = ds === selected;

            return (
              <div
                key={ci}
                className={`flex-1 relative border-l border-white/[0.04] ${sel ? "bg-white/[0.015]" : ""}`}
              >
                {/* hour gridlines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-white/[0.035]"
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}

                {/* now indicator */}
                {today && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                    style={{ top: nowH * HOUR_HEIGHT }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#528BFF] -ml-1" />
                    <div className="flex-1 h-[1.5px] bg-[#528BFF]/50" />
                  </div>
                )}

                {/* events */}
                {layoutOverlappingEvents(dayEv).map(({ event: ev, col, totalCols }) => {
                  const top = timeToY(ev.startTime);
                  const bot = timeToY(ev.endTime);
                  const ht = Math.max(bot - top, 20);
                  const GAP = 2;
                  const leftPx = 2 + col * ((100 / totalCols));
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelect(d)}
                      className="absolute rounded-xl px-2 py-1 text-left hover:brightness-110 transition-all z-[5] overflow-hidden"
                      style={{
                        top,
                        height: ht,
                        left: `calc(${(col / totalCols) * 100}% + ${GAP / 2}px)`,
                        width: `calc(${100 / totalCols}% - ${GAP}px)`,
                        background: ev.color,
                      }}
                    >
                      <p className="text-[10px] text-white font-medium truncate leading-tight">
                        {ev.title}
                      </p>
                      {ht > 30 && (
                        <p className="text-[8px] text-white/80 mt-0.5">
                          {ev.startTime} – {ev.endTime}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MONTH VIEW – clean grid with event chips
   ══════════════════════════════════════════════════════ */

function MonthView({
  year,
  month,
  events,
  selected,
  onSelect,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  selected: string;
  onSelect: (d: Date) => void;
}) {
  const dim = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);
  const prevM = month === 0 ? 11 : month - 1;
  const prevY = month === 0 ? year - 1 : year;
  const dimPrev = daysInMonth(prevY, prevM);
  const nextM = month === 11 ? 0 : month + 1;
  const nextY = month === 11 ? year + 1 : year;

  const cells: { d: number; m: number; y: number; cur: boolean }[] = [];
  for (let i = offset - 1; i >= 0; i--)
    cells.push({ d: dimPrev - i, m: prevM, y: prevY, cur: false });
  for (let d = 1; d <= dim; d++)
    cells.push({ d, m: month, y: year, cur: true });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)
    cells.push({ d, m: nextM, y: nextY, cur: false });

  return (
    <div className="flex flex-col h-full">
      {/* day headers */}
      <div className="grid grid-cols-7">
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] text-white/25 font-medium py-2 border-b border-white/[0.06]"
          >
            {d}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {cells.map((c, i) => {
          const ds = fmt(c.y, c.m, c.d);
          const today = isToday(c.y, c.m, c.d);
          const isSel = ds === selected;
          const dayEvents = events
            .filter((e) => e.date === ds)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <button
              key={i}
              onClick={() => onSelect(new Date(c.y, c.m, c.d))}
              className={`
                flex flex-col items-start pt-1.5 px-1.5 gap-[2px] border-b border-r border-white/[0.04]
                transition-all duration-75 text-left min-h-0 overflow-hidden
                ${!c.cur ? "text-white/12" : "text-white/60"}
                ${isSel ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"}
              `}
            >
              <span
                className={`
                  text-[11px] w-6 h-6 flex items-center justify-center rounded-full mb-[1px] shrink-0
                  ${today ? "bg-[#528BFF] text-white font-semibold" : ""}
                  ${isSel && !today ? "text-white/90 font-medium" : ""}
                `}
              >
                {c.d}
              </span>
              {dayEvents.slice(0, 3).map((ev, j) => (
                <div
                  key={j}
                  className="w-full flex items-center gap-1 px-1 py-[1px] rounded-[3px] truncate"
                  style={{ background: ev.color }}
                >
                  <span className="text-[9px] text-white truncate leading-tight">
                    {ev.title}
                  </span>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <span className="text-[8px] text-white/25 px-1">
                  +{dayEvents.length - 3} more
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   YEAR VIEW – 12 mini‑month grids
   ══════════════════════════════════════════════════════ */

function YearView({
  year,
  events,
  selected,
  onSelect,
}: {
  year: number;
  events: CalendarEvent[];
  selected: string;
  onSelect: (d: Date) => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="grid grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 12 }, (_, mi) => (
          <YearMiniMonth
            key={mi}
            year={year}
            month={mi}
            events={events}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function YearMiniMonth({
  year,
  month,
  events,
  selected,
  onSelect,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  selected: string;
  onSelect: (d: Date) => void;
}) {
  const dim = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);

  return (
    <div className="rounded-xl bg-white/[0.015] border border-white/[0.05] p-3">
      <p className="text-[11px] font-semibold text-white/55 mb-2">
        {MONTHS_SHORT[month]}
      </p>
      <div className="grid grid-cols-7 gap-[1px]">
        {DAYS_NARROW.map((dn, i) => (
          <span key={i} className="text-center text-[8px] text-white/20 pb-0.5 font-medium">
            {dn}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`b${i}`} />
        ))}
        {Array.from({ length: dim }, (_, i) => {
          const d = i + 1;
          const ds = fmt(year, month, d);
          const today = isToday(year, month, d);
          const sel = ds === selected;
          const hasEvents = events.some((e) => e.date === ds);

          return (
            <button
              key={d}
              onClick={() => onSelect(new Date(year, month, d))}
              className={`
                w-full aspect-square flex items-center justify-center rounded-full text-[9px] transition-all
                ${today ? "bg-[#528BFF] text-white font-semibold" : ""}
                ${sel && !today ? "bg-white/[0.08] text-white/85" : ""}
                ${!today && !sel ? "text-white/40 hover:bg-white/[0.05]" : ""}
                ${hasEvents && !today && !sel ? "font-semibold text-white/55" : ""}
              `}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
