"use client";

import { useMemo } from "react";
import {
  Clock,
  CheckCircle,
  Circle,
  CalendarBlank,
  Lightning,
  Timer,
  ArrowRight,
  Sun,
  Moon,
  TrendUp,
} from "@phosphor-icons/react";
import type { CalendarEvent, Task, Habit, FocusSession, ViewType } from "../types";

interface Props {
  events: CalendarEvent[];
  tasks: Task[];
  habits: Habit[];
  focusSessions: FocusSession[];
  onTasksChange: (tasks: Task[]) => void;
  onNavigate: (view: ViewType) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h >= 6 && h < 20)
    return <Sun size={14} weight="light" className="text-amber-400/60" />;
  return <Moon size={14} weight="light" className="text-indigo-400/60" />;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ── Progress Ring ───────────────────────────────── */

function ProgressRing({
  progress,
  size = 52,
  strokeWidth = 3.5,
  color = "#528BFF",
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(progress, 1) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-ring-circle"
          style={
            {
              "--circumference": circumference,
            } as React.CSSProperties
          }
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────── */

export default function TodayView({
  events,
  tasks,
  habits,
  focusSessions,
  onTasksChange,
  onNavigate,
}: Props) {
  const now = new Date();
  const today = todayStr();

  const todayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, today]
  );

  const pendingTasks = tasks.filter((t) => !t.completed);
  const todayTasks = pendingTasks.filter((t) => t.dueDate === today);
  const overdueTasks = pendingTasks.filter(
    (t) => t.dueDate && t.dueDate < today
  );
  const completedToday = tasks.filter(
    (t) => t.completed && t.createdAt && t.createdAt.startsWith(today)
  );

  const habitsCompletedToday = habits.filter((h) =>
    h.completedDates.includes(today)
  ).length;
  const totalHabits = habits.length;
  const habitProgress = totalHabits > 0 ? habitsCompletedToday / totalHabits : 0;

  const todayFocusSessions = focusSessions.filter(
    (s) => s.completedAt.startsWith(today) && s.type === "work"
  );
  const focusMinutes = Math.round(
    todayFocusSessions.reduce((acc, s) => acc + s.duration, 0) / 60
  );

  const taskProgress =
    todayTasks.length + overdueTasks.length > 0
      ? completedToday.length /
        (todayTasks.length + overdueTasks.length + completedToday.length || 1)
      : completedToday.length > 0
      ? 1
      : 0;

  const toggleTask = (id: string) =>
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  // Get current time position for the timeline indicator
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="h-full overflow-y-auto p-6 animate-viewEnter">
      {/* Greeting */}
      <div
        className="mb-8 stagger-item"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 mb-1.5">
          {getGreetingIcon()}
          <p className="text-[13px] text-white/35">{getGreeting()}</p>
        </div>
        <h1 className="text-2xl font-semibold text-white/90">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h1>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 gap-4 mb-8 max-w-2xl stagger-item"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        {/* Tasks stat */}
        <button
          onClick={() => onNavigate("tasks")}
          className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-200"
        >
          <ProgressRing progress={taskProgress} color="#528BFF" size={48} strokeWidth={3}>
            <CheckCircle size={18} weight="light" className="text-blue-400/70" />
          </ProgressRing>
          <div className="text-left min-w-0">
            <p className="text-[22px] font-semibold text-white/85 tabular-nums leading-none">
              {todayTasks.length + overdueTasks.length}
            </p>
            <p className="text-[11px] text-white/30 mt-1">Tasks due</p>
          </div>
        </button>

        {/* Habits stat */}
        <button
          onClick={() => onNavigate("habits")}
          className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-200"
        >
          <ProgressRing progress={habitProgress} color="#34D399" size={48} strokeWidth={3}>
            <Lightning size={18} weight="light" className="text-green-400/70" />
          </ProgressRing>
          <div className="text-left min-w-0">
            <p className="text-[22px] font-semibold text-white/85 tabular-nums leading-none">
              {habitsCompletedToday}
              <span className="text-[13px] text-white/25 font-normal">
                /{totalHabits}
              </span>
            </p>
            <p className="text-[11px] text-white/30 mt-1">Habits done</p>
          </div>
        </button>

        {/* Focus stat */}
        <button
          onClick={() => onNavigate("focus")}
          className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.09] transition-all duration-200"
        >
          <ProgressRing
            progress={Math.min(focusMinutes / 120, 1)}
            color="#A78BFA"
            size={48}
            strokeWidth={3}
          >
            <Timer size={18} weight="light" className="text-purple-400/70" />
          </ProgressRing>
          <div className="text-left min-w-0">
            <p className="text-[22px] font-semibold text-white/85 tabular-nums leading-none">
              {focusMinutes}
              <span className="text-[13px] text-white/25 font-normal">m</span>
            </p>
            <p className="text-[11px] text-white/30 mt-1">Focus time</p>
          </div>
        </button>
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
        {/* Schedule card */}
        <div
          className="rounded-xl bg-white/[0.025] border border-white/[0.06] overflow-hidden stagger-item"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2">
            <CalendarBlank
              size={15}
              weight="light"
              className="text-white/30"
            />
            <span className="text-[13px] font-medium text-white/55">
              Schedule
            </span>
            <span className="ml-auto text-[11px] text-white/20 tabular-nums">
              {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => onNavigate("calendar")}
              className="ml-1 p-0.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all"
            >
              <ArrowRight size={12} weight="light" />
            </button>
          </div>
          <div className="p-4">
            {todayEvents.length === 0 ? (
              <p className="text-[12px] text-white/15 text-center py-8">
                No events scheduled
              </p>
            ) : (
              <div className="space-y-1">
                {todayEvents.slice(0, 6).map((ev, i) => {
                  const isNow =
                    ev.startTime <=
                      `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}` &&
                    ev.endTime >
                      `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

                  return (
                    <div
                      key={ev.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 stagger-item-fast ${
                        isNow
                          ? "bg-white/[0.04]"
                          : "hover:bg-white/[0.025]"
                      }`}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <div
                        className="w-[3px] shrink-0 self-stretch rounded-full min-h-[32px]"
                        style={{ background: ev.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-white/80 font-medium truncate">
                          {ev.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/30">
                          <Clock size={10} weight="light" />
                          <span className="tabular-nums">
                            {ev.startTime} — {ev.endTime}
                          </span>
                          {isNow && (
                            <span className="text-[9px] text-blue-400/70 font-medium ml-1">
                              NOW
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {todayEvents.length > 6 && (
                  <button
                    onClick={() => onNavigate("calendar")}
                    className="text-[11px] text-white/25 hover:text-white/40 transition-colors px-2 py-1"
                  >
                    +{todayEvents.length - 6} more events
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tasks card */}
        <div
          className="rounded-xl bg-white/[0.025] border border-white/[0.06] overflow-hidden stagger-item"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center gap-2">
            <CheckCircle
              size={15}
              weight="light"
              className="text-white/30"
            />
            <span className="text-[13px] font-medium text-white/55">
              Tasks
            </span>
            <span className="ml-auto text-[11px] text-white/20 tabular-nums">
              {pendingTasks.length} pending
            </span>
            <button
              onClick={() => onNavigate("tasks")}
              className="ml-1 p-0.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all"
            >
              <ArrowRight size={12} weight="light" />
            </button>
          </div>
          <div className="p-3">
            {[...overdueTasks, ...todayTasks].length === 0 ? (
              <div className="text-center py-8">
                <TrendUp
                  size={20}
                  weight="light"
                  className="text-green-400/30 mx-auto mb-2"
                />
                <p className="text-[12px] text-white/20">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {[...overdueTasks, ...todayTasks]
                  .slice(0, 7)
                  .map((task, i) => {
                    const isOverdue = !!(
                      task.dueDate && task.dueDate < today
                    );
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-white/[0.03] transition-all duration-200 stagger-item-fast"
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="text-white/20 hover:text-blue-400 transition-all duration-200 shrink-0 hover:scale-110"
                        >
                          <Circle size={16} weight="light" />
                        </button>
                        <span className="flex-1 text-[13px] text-white/65 truncate">
                          {task.title}
                        </span>
                        {task.priority === "high" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400/60 shrink-0" />
                        )}
                        {isOverdue && (
                          <span className="text-[10px] text-red-400/60 shrink-0">
                            overdue
                          </span>
                        )}
                        {task.dueDate === today && !isOverdue && (
                          <span className="text-[10px] text-blue-400/50 shrink-0">
                            today
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
