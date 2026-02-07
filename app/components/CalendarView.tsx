"use client";

import { useEffect, useRef, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  Plus,
  Clock,
  Trash,
  X,
} from "@phosphor-icons/react";
import type { CalendarEvent } from "../types";

/* ── constants ───────────────────────────────────────── */

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const EVENT_COLORS = [
  "#60a5fa","#34d399","#a78bfa","#fb923c","#f87171","#2dd4bf",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function timeToY(time: string, hourH: number) {
  const [h, m] = time.split(":").map(Number);
  return h * hourH + (m / 60) * hourH;
}

/* ── main component ──────────────────────────────────── */

export default function CalendarView({ events, onEventsChange }: Props) {
  const now = new Date();
  const [mode, setMode] = useState<CalMode>("month");
  const [cursor, setCursor] = useState(new Date(now));
  const [selected, setSelected] = useState(fmtDate(now));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    color: EVENT_COLORS[0],
  });

  /* scroll day/week timeline to ~8 AM on mount */
  const timelineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((mode === "day" || mode === "week") && timelineRef.current) {
      timelineRef.current.scrollTop = 8 * 60; // 8h * hourH(60)
    }
  }, [mode]);

  /* ── navigation ────────────────────────────────── */

  const navigate = (dir: number) => {
    const d = new Date(cursor);
    if (mode === "day") d.setDate(d.getDate() + dir);
    else if (mode === "week") d.setDate(d.getDate() + dir * 7);
    else if (mode === "month") d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setCursor(d);
  };

  const goToday = () => {
    const d = new Date();
    setCursor(d);
    setSelected(fmtDate(d));
  };

  /* select a date (from any sub‑view) */
  const selectDate = (d: Date) => {
    setSelected(fmtDate(d));
    setCursor(d);
  };

  /* header label */
  const headerLabel = (() => {
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
      const sm = ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const em = we.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${sm} – ${em}`;
    }
    if (mode === "month")
      return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    return `${cursor.getFullYear()}`;
  })();

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
      {/* ── left: calendar area ──────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* toolbar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white/90 min-w-0 truncate">
              {headerLabel}
            </h2>
            <button
              onClick={goToday}
              className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.05] text-white/40 hover:text-white/70 hover:bg-white/[0.09] transition-all shrink-0"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* view switcher */}
            <div className="flex rounded-lg bg-white/[0.04] p-0.5">
              {(["day", "week", "month", "year"] as CalMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 text-[11px] rounded-md capitalize transition-all ${
                    mode === m
                      ? "bg-white/[0.08] text-white/85"
                      : "text-white/35 hover:text-white/55"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* prev / next */}
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/40 hover:text-white/70 transition-all"
              >
                <CaretLeft size={15} weight="light" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/40 hover:text-white/70 transition-all"
              >
                <CaretRight size={15} weight="light" />
              </button>
            </div>
          </div>
        </div>

        {/* content area */}
        <div className="flex-1 overflow-hidden px-6 pb-4">
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

      {/* ── right: detail panel ──────────────────── */}
      <div className="w-72 border-l border-white/[0.06] flex flex-col shrink-0">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-white/90">
                {selDate.toLocaleDateString("en-US", { weekday: "long" })}
              </h3>
              <p className="text-[13px] text-white/35 mt-0.5">
                {selDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => setAdding(!adding)}
              className={`p-1.5 rounded-md transition-all ${
                adding
                  ? "bg-white/[0.08] text-white/60"
                  : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
              }`}
            >
              {adding ? <X size={15} weight="light" /> : <Plus size={15} weight="light" />}
            </button>
          </div>
        </div>

        {adding && (
          <div className="p-4 border-b border-white/[0.06] space-y-2.5">
            <input
              type="text"
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              className="w-full px-3 py-2 text-[13px] rounded-md"
              autoFocus
            />
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="flex-1 px-2.5 py-1.5 text-[12px] rounded-md"
              />
              <span className="text-[11px] text-white/25">→</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm({ ...form, endTime: e.target.value })
                }
                className="flex-1 px-2.5 py-1.5 text-[12px] rounded-md"
              />
            </div>
            <div className="flex gap-1.5">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-5 h-5 rounded-full transition-all ${
                    form.color === c
                      ? "ring-2 ring-white/30 scale-110"
                      : "opacity-50 hover:opacity-90"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <button
              onClick={addEvent}
              disabled={!form.title.trim()}
              className="w-full py-2 text-[13px] rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-default transition-all"
            >
              Add Event
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {selEvents.length === 0 ? (
            <p className="text-[13px] text-white/20 text-center mt-10">
              No events
            </p>
          ) : (
            selEvents.map((ev) => (
              <div
                key={ev.id}
                className="group flex items-start gap-3 p-3 rounded-lg bg-white/[0.025] hover:bg-white/[0.05] transition-all"
              >
                <div
                  className="w-[3px] shrink-0 self-stretch rounded-full"
                  style={{ background: ev.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/80 font-medium truncate">
                    {ev.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/35">
                    <Clock size={11} weight="light" />
                    {ev.startTime} — {ev.endTime}
                  </div>
                </div>
                <button
                  onClick={() => delEvent(ev.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.08] text-white/25 hover:text-red-400 transition-all"
                >
                  <Trash size={13} weight="light" />
                </button>
              </div>
            ))
          )}
        </div>
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
  const hourH = 60; // px per hour
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;

  return (
    <div
      ref={timelineRef}
      className="h-full overflow-y-auto relative rounded-lg"
    >
      <div className="relative" style={{ height: 24 * hourH }}>
        {/* hour rows */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute w-full flex border-t border-white/[0.04]"
            style={{ top: h * hourH, height: hourH }}
          >
            <span className="w-14 shrink-0 text-[10px] text-white/20 pt-1.5 text-right pr-3">
              {String(h).padStart(2, "0")}:00
            </span>
            <div className="flex-1" />
          </div>
        ))}

        {/* now line */}
        {isTodayDate(date) && (
          <div
            className="absolute left-14 right-0 h-[2px] bg-blue-400/50 z-10 pointer-events-none"
            style={{ top: nowH * hourH }}
          >
            <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-blue-400" />
          </div>
        )}

        {/* events */}
        {dayEvents.map((ev) => {
          const top = timeToY(ev.startTime, hourH);
          const bot = timeToY(ev.endTime, hourH);
          const h = Math.max(bot - top, 20);
          return (
            <button
              key={ev.id}
              onClick={() => onSelect(date)}
              className="absolute left-16 right-4 rounded-md px-2.5 py-1.5 text-left hover:brightness-110 transition-all z-[5]"
              style={{
                top,
                height: h,
                background: ev.color + "22",
                borderLeft: `3px solid ${ev.color}`,
              }}
            >
              <p className="text-[12px] text-white/80 font-medium truncate">
                {ev.title}
              </p>
              {h > 30 && (
                <p className="text-[10px] text-white/35 mt-0.5">
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
   WEEK VIEW – 7 columns × 24 h
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
  const hourH = 56;
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const todayDateStr = fmtDate(new Date());

  return (
    <div className="flex flex-col h-full">
      {/* day headers */}
      <div className="flex shrink-0 border-b border-white/[0.06]">
        <div className="w-14 shrink-0" />
        {weekDates.map((d, i) => {
          const ds = fmtDate(d);
          const today = isTodayDate(d);
          const sel = ds === selected;
          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 hover:bg-white/[0.03] transition-all"
            >
              <span className="text-[10px] text-white/30 uppercase">
                {DAYS_SHORT[i]}
              </span>
              <span
                className={`text-[14px] w-7 h-7 flex items-center justify-center rounded-full ${
                  today
                    ? "bg-blue-500/80 text-white font-semibold"
                    : sel
                    ? "bg-white/[0.08] text-white/90"
                    : "text-white/55"
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
        <div className="relative flex" style={{ height: 24 * hourH }}>
          {/* time gutter */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute text-[10px] text-white/20 text-right pr-3 w-14"
                style={{ top: h * hourH + 2 }}
              >
                {String(h).padStart(2, "0")}:00
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
            return (
              <div
                key={ci}
                className="flex-1 relative border-l border-white/[0.04]"
              >
                {/* hour rows */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-white/[0.035]"
                    style={{ top: h * hourH, height: hourH }}
                  />
                ))}

                {/* now line */}
                {today && (
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-blue-400/40 z-10 pointer-events-none"
                    style={{ top: nowH * hourH }}
                  />
                )}

                {/* events */}
                {dayEv.map((ev) => {
                  const top = timeToY(ev.startTime, hourH);
                  const bot = timeToY(ev.endTime, hourH);
                  const ht = Math.max(bot - top, 18);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelect(d)}
                      className="absolute left-0.5 right-0.5 rounded-[5px] px-1.5 py-1 text-left hover:brightness-110 transition-all z-[5]"
                      style={{
                        top,
                        height: ht,
                        background: ev.color + "22",
                        borderLeft: `2px solid ${ev.color}`,
                      }}
                    >
                      <p className="text-[10px] text-white/80 font-medium truncate leading-tight">
                        {ev.title}
                      </p>
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
   MONTH VIEW – classic grid with event indicators
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
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] text-white/25 font-medium py-1.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px">
        {cells.map((c, i) => {
          const ds = fmt(c.y, c.m, c.d);
          const today = isToday(c.y, c.m, c.d);
          const isSel = ds === selected;
          const dots = events.filter((e) => e.date === ds);

          return (
            <button
              key={i}
              onClick={() => onSelect(new Date(c.y, c.m, c.d))}
              className={`
                flex flex-col items-center justify-start pt-1.5 gap-1
                rounded-lg transition-all duration-100
                ${!c.cur ? "text-white/15" : "text-white/65"}
                ${isSel ? "bg-white/[0.07]" : "hover:bg-white/[0.035]"}
              `}
            >
              <span
                className={`
                  text-[13px] w-7 h-7 flex items-center justify-center rounded-full
                  ${today ? "bg-blue-500/80 text-white font-semibold" : ""}
                  ${isSel && !today ? "text-white/95 font-medium" : ""}
                `}
              >
                {c.d}
              </span>
              {dots.length > 0 && (
                <div className="flex gap-[3px]">
                  {dots.slice(0, 3).map((e, j) => (
                    <span
                      key={j}
                      className="block w-[5px] h-[5px] rounded-full"
                      style={{ background: e.color }}
                    />
                  ))}
                </div>
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
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
        {Array.from({ length: 12 }, (_, mi) => (
          <MiniMonth
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

function MiniMonth({
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

  const blanks = Array.from({ length: offset }, (_, i) => (
    <div key={`b${i}`} />
  ));

  const days = Array.from({ length: dim }, (_, i) => {
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
          w-full aspect-square flex items-center justify-center rounded-full text-[10px] transition-all
          ${today ? "bg-blue-500/70 text-white font-semibold" : ""}
          ${sel && !today ? "bg-white/[0.09] text-white/90" : ""}
          ${!today && !sel ? "text-white/45 hover:bg-white/[0.06]" : ""}
          ${hasEvents && !today ? "font-semibold" : ""}
        `}
      >
        {d}
      </button>
    );
  });

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
      <p className="text-[12px] font-medium text-white/60 mb-2">
        {MONTHS_SHORT[month]}
      </p>
      <div className="grid grid-cols-7 gap-[2px]">
        {DAYS_SHORT.map((dn) => (
          <span
            key={dn}
            className="text-center text-[8px] text-white/20 pb-0.5"
          >
            {dn.charAt(0)}
          </span>
        ))}
        {blanks}
        {days}
      </div>
    </div>
  );
}
