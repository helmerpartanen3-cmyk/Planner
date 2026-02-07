"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  X,
  Trash,
  Lightning,
  Fire,
  TrendUp,
} from "@phosphor-icons/react";
import type { Habit } from "../types";

const EMOJI_OPTIONS = ["💧", "📖", "🏃", "🧘", "💪", "🎯", "📝", "🌿", "😴", "🍎", "🧠", "⏰"];
const COLOR_OPTIONS = ["#528BFF", "#34D399", "#A78BFA", "#FB923C", "#F87171", "#2DD4BF"];
const DAYS_LABEL = ["M", "T", "W", "T", "F", "S", "S"];

interface Props {
  habits: Habit[];
  onHabitsChange: (habits: Habit[]) => void;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function getStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse();
  const today = todayStr();
  let streak = 0;
  const checkDate = new Date();

  // If today is completed, start from today; otherwise start from yesterday
  if (sorted[0] === today) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
    for (let i = 1; i < sorted.length; i++) {
      const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      if (sorted[i] === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    // Check if yesterday was the last completed
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterday = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    if (sorted[0] === yesterday) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      for (let i = 1; i < sorted.length; i++) {
        const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
        if (sorted[i] === expected) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }
  return streak;
}

export default function HabitsView({ habits, onHabitsChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "🎯", color: COLOR_OPTIONS[0] });
  const today = todayStr();
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayDayIndex = new Date().getDay();
  const todayWeekIdx = todayDayIndex === 0 ? 6 : todayDayIndex - 1;

  const completedToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? completedToday / totalHabits : 0;

  const addHabit = () => {
    if (!form.name.trim()) return;
    onHabitsChange([
      ...habits,
      {
        id: Date.now().toString(),
        name: form.name.trim(),
        emoji: form.emoji,
        color: form.color,
        completedDates: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    setForm({ name: "", emoji: "🎯", color: COLOR_OPTIONS[0] });
    setAdding(false);
  };

  const toggleHabit = (id: string) => {
    onHabitsChange(
      habits.map((h) => {
        if (h.id !== id) return h;
        const isCompleted = h.completedDates.includes(today);
        return {
          ...h,
          completedDates: isCompleted
            ? h.completedDates.filter((d) => d !== today)
            : [...h.completedDates, today],
        };
      })
    );
  };

  const deleteHabit = (id: string) => {
    onHabitsChange(habits.filter((h) => h.id !== id));
  };

  return (
    <div className="h-full overflow-y-auto p-6 animate-viewEnter">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white/90">Habits</h2>
            <p className="text-[12px] text-white/30 mt-0.5">
              {totalHabits > 0
                ? `${completedToday}/${totalHabits} completed today`
                : "Build consistent daily routines"}
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

        {/* Progress bar */}
        {totalHabits > 0 && (
          <div className="mb-6 stagger-item" style={{ "--i": 0 } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/35">Today&apos;s progress</span>
              <span className="text-[11px] text-white/50 font-medium tabular-nums">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Add habit form */}
        {adding && (
          <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3 animate-slideDown">
            <input
              type="text"
              placeholder="Habit name..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addHabit()}
              className="w-full px-3 py-2 text-[13px] rounded-lg"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setForm({ ...form, emoji: e })}
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
                      form.emoji === e
                        ? "bg-white/[0.08] scale-110"
                        : "hover:bg-white/[0.04] opacity-50 hover:opacity-100"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {COLOR_OPTIONS.map((c) => (
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
                onClick={addHabit}
                disabled={!form.name.trim()}
                className="px-4 py-1.5 text-[12px] rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-default transition-all font-medium"
              >
                Add Habit
              </button>
            </div>
          </div>
        )}

        {/* Week header */}
        {habits.length > 0 && (
          <div className="flex items-center mb-2 pl-[52px]">
            <div className="flex-1" />
            <div className="flex items-center gap-[6px] mr-1">
              {DAYS_LABEL.map((d, i) => (
                <span
                  key={i}
                  className={`w-6 text-center text-[9px] font-medium ${
                    i === todayWeekIdx ? "text-blue-400/70" : "text-white/20"
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="w-8" />
          </div>
        )}

        {/* Habits list */}
        <div className="space-y-1">
          {habits.length === 0 && !adding && (
            <div className="text-center mt-20">
              <Lightning size={32} weight="light" className="text-white/10 mx-auto mb-3" />
              <p className="text-[13px] text-white/20">No habits yet</p>
              <p className="text-[11px] text-white/15 mt-1">
                Start building your daily routines
              </p>
            </div>
          )}

          {habits.map((habit, idx) => {
            const isCompletedToday = habit.completedDates.includes(today);
            const streak = getStreak(habit.completedDates);

            return (
              <div
                key={habit.id}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all duration-200 stagger-item"
                style={{ "--i": idx + 1 } as React.CSSProperties}
              >
                {/* Toggle button */}
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all duration-300 ${
                    isCompletedToday
                      ? "bg-opacity-20 scale-105"
                      : "bg-white/[0.04] hover:bg-white/[0.06]"
                  }`}
                  style={
                    isCompletedToday
                      ? { background: habit.color + "25" }
                      : undefined
                  }
                >
                  <span className={isCompletedToday ? "animate-checkPop" : "opacity-60"}>
                    {habit.emoji}
                  </span>
                </button>

                {/* Name and streak */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] font-medium truncate transition-all ${
                      isCompletedToday ? "text-white/80" : "text-white/60"
                    }`}
                  >
                    {habit.name}
                  </p>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Fire
                        size={10}
                        weight="fill"
                        className="text-orange-400/70"
                      />
                      <span className="text-[10px] text-orange-400/60 tabular-nums">
                        {streak} day streak
                      </span>
                    </div>
                  )}
                </div>

                {/* Weekly dots */}
                <div className="flex items-center gap-[6px]">
                  {weekDates.map((date, i) => {
                    const completed = habit.completedDates.includes(date);
                    const isFuture = date > today;
                    return (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 ${
                          completed
                            ? ""
                            : isFuture
                            ? "bg-white/[0.02]"
                            : "bg-white/[0.04]"
                        }`}
                        style={completed ? { background: habit.color + "20" } : undefined}
                      >
                        {completed && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: habit.color }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/[0.08] text-white/20 hover:text-red-400 transition-all shrink-0"
                >
                  <Trash size={13} weight="light" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Stats footer */}
        {habits.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 text-center stagger-item" style={{ "--i": habits.length + 2 } as React.CSSProperties}>
              <TrendUp size={16} weight="light" className="text-blue-400/50 mx-auto mb-1.5" />
              <p className="text-xl font-semibold text-white/80 tabular-nums">{completedToday}</p>
              <p className="text-[10px] text-white/25 mt-0.5">Done today</p>
            </div>
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 text-center stagger-item" style={{ "--i": habits.length + 3 } as React.CSSProperties}>
              <Fire size={16} weight="light" className="text-orange-400/50 mx-auto mb-1.5" />
              <p className="text-xl font-semibold text-white/80 tabular-nums">
                {Math.max(0, ...habits.map((h) => getStreak(h.completedDates)))}
              </p>
              <p className="text-[10px] text-white/25 mt-0.5">Best streak</p>
            </div>
            <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 text-center stagger-item" style={{ "--i": habits.length + 4 } as React.CSSProperties}>
              <Lightning size={16} weight="light" className="text-purple-400/50 mx-auto mb-1.5" />
              <p className="text-xl font-semibold text-white/80 tabular-nums">{totalHabits}</p>
              <p className="text-[10px] text-white/25 mt-0.5">Active habits</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
