// Tavat-näkymä. Hallinnoi päivittäisiä tavahtumisia ja niiden aineita.

"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Fire,
  Trophy,
  Lightning,
  Check,
  Trash,
  X,
  CalendarBlank,
  TrendUp,
  Star,
  ArrowRight,
  Plant,
  ChartBar,
} from "@phosphor-icons/react";
import type { Habit } from "../../types";
import { APP_COLORS } from "../../config";
import { ICON_OPTIONS, getHabitIcon } from "../../lib";

interface HabitsViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

export default function HabitsView({ habits, setHabits }: HabitsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("barbell");
  const [newColor, setNewColor] = useState(APP_COLORS[0]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // --- Contribution heatmap helpers ---
  const getLast12Weeks = useCallback(() => {
    const weeks: string[][] = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Go to the end of this week (Saturday)
    const dayOfWeek = d.getDay();
    d.setDate(d.getDate() + (6 - dayOfWeek));
    // Build 12 weeks backwards
    for (let w = 0; w < 12; w++) {
      const week: string[] = [];
      for (let day = 6; day >= 0; day--) {
        const date = new Date(d);
        date.setDate(d.getDate() - day - w * 7);
        week.push(date.toISOString().split("T")[0]);
      }
      weeks.unshift(week);
    }
    return weeks;
  }, []);

  const weeks = useMemo(() => getLast12Weeks(), [getLast12Weeks]);

  const getHabitCompletionRate = useCallback(
    (habit: Habit) => {
      const last30 = [];
      const d = new Date();
      for (let i = 0; i < 30; i++) {
        last30.push(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() - 1);
      }
      const completed = last30.filter((day) => habit.completedDates.includes(day)).length;
      return Math.round((completed / 30) * 100);
    },
    []
  );

  const getStreak = useCallback((habit: Habit) => {
    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().split("T")[0];
      if (habit.completedDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, []);

  const getBestStreak = useCallback((habit: Habit) => {
    if (habit.completedDates.length === 0) return 0;
    const sorted = [...habit.completedDates].sort();
    let best = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }
    return Math.max(best, current);
  }, []);

  const toggleHabit = useCallback(
    (id: string, date: string) => {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                completedDates: h.completedDates.includes(date)
                  ? h.completedDates.filter((d) => d !== date)
                  : [...h.completedDates, date],
              }
            : h
        )
      );
    },
    [setHabits]
  );

  const addHabit = useCallback(() => {
    if (!newName.trim()) return;
    const habit: Habit = {
      id: Date.now().toString(),
      name: newName.trim(),
      emoji: newIcon,
      color: newColor,
      completedDates: [],
      createdAt: today,
    };
    setHabits((prev) => [...prev, habit]);
    setNewName("");
    setNewIcon("barbell");
    setNewColor(APP_COLORS[0]);
    setShowForm(false);
  }, [newName, newIcon, newColor, today, setHabits]);

  const deleteHabit = useCallback(
    (id: string) => {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      if (selectedHabit === id) setSelectedHabit(null);
    },
    [setHabits, selectedHabit]
  );

  // --- Stats ---
  const totalCompletionsToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const overallRate = habits.length
    ? Math.round(habits.reduce((sum, h) => sum + getHabitCompletionRate(h), 0) / habits.length)
    : 0;
  const longestStreak = habits.length ? Math.max(...habits.map((h) => getBestStreak(h))) : 0;

  const detail = selectedHabit ? habits.find((h) => h.id === selectedHabit) : null;

  return (
    <div className="flex h-full gap-4 p-6 overflow-hidden">
      {/* Left column - habit list */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-white/90 text-gradient">Habits</h1>
            <p className="text-[13px] text-white/40 mt-0.5">Build consistency, one day at a time</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 press-effect ${
              showForm
                ? "bg-white/[0.08] text-white/60"
                : "bg-[#528BFF]/15 text-[#528BFF] hover:bg-[#528BFF]/25"
            }`}
          >
            {showForm ? <X size={14} weight="light" /> : <Plus size={14} weight="light" />}
            {showForm ? "Cancel" : "New Habit"}
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today", value: `${totalCompletionsToday}/${habits.length}`, icon: Check, color: "#34D399" },
            { label: "Consistency", value: `${overallRate}%`, icon: TrendUp, color: "#528BFF" },
            { label: "Best Streak", value: `${longestStreak}d`, icon: Fire, color: "#F59E0B" },
          ].map((s, i) => (
            <div
              key={i}
              className="glass-card-static p-3 flex items-center gap-3"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}18` }}
              >
                <s.icon size={18} weight="bold" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[17px] font-bold text-white/90 stat-number">{s.value}</div>
                <div className="text-[11px] text-white/35 font-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* New habit form */}
        {showForm && (
          <div className="glass-card-static p-4 animate-modal space-y-3">
            <div className="text-[13px] font-semibold text-white/70">New Habit</div>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[13px] text-white/90 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
              placeholder="Habit name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHabit()}
              autoFocus
            />
            {/* Icon picker */}
            <div>
              <div className="text-[11px] text-white/35 mb-1.5 font-medium">Icon</div>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setNewIcon(opt.key)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      newIcon === opt.key
                        ? "bg-white/15 scale-110 ring-1 ring-white/20"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    title={opt.label}
                  >
                    <opt.icon size={16} weight="light" className="text-white/70" />
                  </button>
                ))}
              </div>
            </div>
            {/* Color picker */}
            <div>
              <div className="text-[11px] text-white/35 mb-1.5 font-medium">Color</div>
              <div className="flex gap-2">
                {APP_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-lg transition-all ${
                      newColor === c ? "scale-110 ring-2 ring-white/30" : "hover:scale-105"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={addHabit}
              className="w-full py-2 rounded-xl text-[13px] font-semibold text-white press-effect transition-expo"
              style={{ background: "var(--accent)" }}
            >
              Create Habit
            </button>
          </div>
        )}

        {/* Habit cards */}
        {habits.length === 0 && !showForm ? (
          <div className="glass-card-static p-8 text-center animate-modal">
            <Plant size={32} weight="light" className="text-white/15 mx-auto mb-3" />
            <div className="text-[14px] font-semibold text-white/60 mb-1">No habits yet</div>
            <div className="text-[12px] text-white/30">Start building your routine</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {habits.map((habit, idx) => {
              const streak = getStreak(habit);
              const completedToday = habit.completedDates.includes(today);
              const rate = getHabitCompletionRate(habit);
              const isSelected = selectedHabit === habit.id;

              return (
                <div
                  key={habit.id}
                  className={`glass-card p-3.5 cursor-pointer transition-expo ${
                    isSelected ? "ring-1" : ""
                  }`}
                  style={{
                    animationDelay: `${idx * 40}ms`,
                    borderColor: isSelected ? `${habit.color}40` : undefined,
                  }}
                  onClick={() => setSelectedHabit(isSelected ? null : habit.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabit(habit.id, today);
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all press-effect shrink-0"
                      style={{
                        background: completedToday ? habit.color : `${habit.color}15`,
                        boxShadow: completedToday ? `0 0 20px ${habit.color}30` : "none",
                      }}
                    >
                      {(() => {
                        const HabitIcon = getHabitIcon(habit.emoji);
                        return completedToday ? (
                          <Check size={18} weight="bold" className="text-white" />
                        ) : (
                          <HabitIcon size={18} weight="light" style={{ color: habit.color }} />
                        );
                      })()}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-white/85 truncate">{habit.name}</span>
                        {streak >= 3 && (
                          <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: "#F59E0B" }}>
                            <Fire size={12} weight="fill" />
                            {streak}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-white/30 font-medium">{rate}% this month</span>
                        {/* Mini week dots */}
                        <div className="flex gap-0.5">
                          {(() => {
                            const d = new Date();
                            const dots = [];
                            for (let i = 6; i >= 0; i--) {
                              const date = new Date(d);
                              date.setDate(d.getDate() - i);
                              const ds = date.toISOString().split("T")[0];
                              const done = habit.completedDates.includes(ds);
                              dots.push(
                                <div
                                  key={ds}
                                  className="w-[6px] h-[6px] rounded-full transition-all"
                                  style={{
                                    background: done ? habit.color : "rgba(255,255,255,0.08)",
                                    boxShadow: done ? `0 0 6px ${habit.color}50` : "none",
                                  }}
                                />
                              );
                            }
                            return dots;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                      size={14}
                      className={`text-white/20 transition-all ${isSelected ? "rotate-90 text-white/40" : ""}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel - detail / heatmap */}
      <div className="w-72 flex flex-col gap-3 shrink-0 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {detail ? (
          <>
            {/* Header card */}
            <div className="glass-card-static p-4 animate-modal">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${detail.color}20` }}
                  >
                    {(() => { const I = getHabitIcon(detail.emoji); return <I size={20} weight="light" style={{ color: detail.color }} />; })()}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-white/90">{detail.name}</div>
                    <div className="text-[11px] text-white/30">
                      Since {new Date(detail.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteHabit(detail.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash size={14} />
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Streak", value: getStreak(detail), suffix: "d", icon: Fire, color: "#F59E0B" },
                  { label: "Best", value: getBestStreak(detail), suffix: "d", icon: Trophy, color: "#A78BFA" },
                  { label: "Rate", value: getHabitCompletionRate(detail), suffix: "%", icon: Lightning, color: "#34D399" },
                ].map((st, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl text-center"
                    style={{ background: `${st.color}08` }}
                  >
                    <st.icon size={14} weight="fill" style={{ color: st.color }} className="mx-auto mb-1" />
                    <div className="text-[15px] font-bold text-white/85 stat-number">
                      {st.value}
                      <span className="text-[10px] text-white/30 font-medium">{st.suffix}</span>
                    </div>
                    <div className="text-[10px] text-white/25 font-medium">{st.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contribution heatmap */}
            <div className="glass-card-static p-4 animate-modal" style={{ animationDelay: "50ms" }}>
              <div className="text-[12px] font-semibold text-white/50 mb-3 flex items-center gap-1.5">
                <CalendarBlank size={13} weight="bold" />
                12 Week Activity
              </div>
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day) => {
                      const done = detail.completedDates.includes(day);
                      const isToday = day === today;
                      return (
                        <button
                          key={day}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabit(detail.id, day);
                          }}
                          className="w-[22px] h-[22px] rounded-[5px] transition-all hover:scale-125"
                          style={{
                            background: done ? detail.color : "rgba(255,255,255,0.04)",
                            opacity: done ? 1 : 0.6,
                            boxShadow: done
                              ? `0 0 8px ${detail.color}40`
                              : isToday
                                ? `inset 0 0 0 1px rgba(255,255,255,0.15)`
                                : "none",
                          }}
                          title={day}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex items-center justify-between mt-3 text-[10px] text-white/25">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0.04, 0.3, 0.6, 1].map((op, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-[3px]"
                      style={{
                        background: i === 0 ? "rgba(255,255,255,0.04)" : detail.color,
                        opacity: op,
                      }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Monthly completion log */}
            <div className="glass-card-static p-4 animate-modal" style={{ animationDelay: "100ms" }}>
              <div className="text-[12px] font-semibold text-white/50 mb-3 flex items-center gap-1.5">
                <Star size={13} weight="bold" />
                This Month
              </div>
              <div className="flex flex-wrap gap-[4px]">
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = now.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const todayDate = now.getDate();
                  const cells = [];
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const done = detail.completedDates.includes(dateStr);
                    const isFuture = d > todayDate;
                    cells.push(
                      <div
                        key={d}
                        className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[10px] font-medium transition-all"
                        style={{
                          background: done ? `${detail.color}25` : "rgba(255,255,255,0.03)",
                          color: done ? detail.color : isFuture ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.25)",
                          border: d === todayDate ? `1px solid ${detail.color}40` : "1px solid transparent",
                        }}
                      >
                        {d}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
          </>
        ) : (
          /* Default side panel */
          <div className="glass-card-static p-5 flex flex-col items-center justify-center text-center h-64 animate-modal">
            <ChartBar size={32} weight="light" className="text-white/15 mx-auto mb-3" />
            <div className="text-[13px] font-semibold text-white/50 mb-1">Select a habit</div>
            <div className="text-[11px] text-white/25 leading-relaxed">
              Click on any habit to see detailed<br />statistics and contribution map
            </div>
          </div>
        )}

        {/* Overall heatmap for all habits when none selected */}
        {!detail && habits.length > 0 && (
          <div className="glass-card-static p-4 animate-modal" style={{ animationDelay: "50ms" }}>
            <div className="text-[12px] font-semibold text-white/50 mb-2">Habit Leaderboard</div>
            <div className="space-y-2">
              {[...habits]
                .sort((a, b) => getStreak(b) - getStreak(a))
                .map((h) => {
                  const rate = getHabitCompletionRate(h);
                  return (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHabit(h.id)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-all text-left"
                    >
                      {(() => { const I = getHabitIcon(h.emoji); return <I size={16} weight="light" style={{ color: h.color }} />; })()}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-white/70 truncate">{h.name}</div>
                        <div className="w-full h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${rate}%`, background: h.color }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-white/40">{rate}%</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
