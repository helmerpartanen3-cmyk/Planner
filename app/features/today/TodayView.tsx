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
  Fire,
  Target,
  Sparkle,
} from "@phosphor-icons/react";
import type { CalendarEvent, Task, Habit, FocusSession, Goal, ViewType } from "../../types";
import { getHabitIcon } from "../../lib";
import { todayStr } from "../../lib";

interface Props {
  events: CalendarEvent[];
  tasks: Task[];
  habits: Habit[];
  focusSessions: FocusSession[];
  goals: Goal[];
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
    return <Sun size={16} weight="regular" className="text-amber-400/70" />;
  return <Moon size={16} weight="regular" className="text-indigo-400/70" />;
}

/* ── Progress Ring ───────────────────────────────── */

function ProgressRing({
  progress,
  size = 44,
  strokeWidth = 2.5,
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

/* ── Productivity Score ──────────────────────────── */

function getProductivityScore(
  taskProgress: number,
  habitProgress: number,
  focusMinutes: number,
  goalProgress: number
): number {
  const taskScore = taskProgress * 30;
  const habitScore = habitProgress * 30;
  const focusScore = Math.min(focusMinutes / 120, 1) * 25;
  const goalScore = goalProgress * 15;
  return Math.round(taskScore + habitScore + focusScore + goalScore);
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Outstanding";
  if (score >= 75) return "Excellent";
  if (score >= 60) return "Great";
  if (score >= 40) return "Good start";
  if (score >= 20) return "Getting going";
  return "Ready to start";
}

/* ── Main Component ──────────────────────────────── */

export default function TodayView({
  events,
  tasks,
  habits,
  focusSessions,
  goals,
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

  const activeGoals = goals.filter((g) => g.progress < 100);
  const goalProgress = goals.length > 0
    ? goals.reduce((acc, g) => acc + g.progress, 0) / (goals.length * 100)
    : 0;

  const productivityScore = getProductivityScore(
    taskProgress,
    habitProgress,
    focusMinutes,
    goalProgress
  );

  const toggleTask = (id: string) =>
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="h-full overflow-y-auto p-6 animate-viewEnter">
      {/* Greeting + Productivity Score */}
      <div className="flex items-start justify-between mb-8 stagger-item" style={{ "--i": 0 } as React.CSSProperties}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {getGreetingIcon()}
            <p className="text-[13px] text-white/35">{getGreeting()}</p>
          </div>
          <h1 className="text-2xl font-semibold text-gradient">
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h1>
        </div>

        {/* Productivity Score */}
        <div className="flex items-center gap-4 glass-card px-5 py-3.5">
          <ProgressRing
            progress={productivityScore / 100}
            size={48}
            strokeWidth={3}
            color={productivityScore >= 60 ? "#34D399" : productivityScore >= 30 ? "#F59E0B" : "#528BFF"}
          >
            <Sparkle size={16} weight="fill" className="text-white/40" />
          </ProgressRing>
          <div>
            <p className="text-[22px] font-semibold text-white/90 tabular-nums leading-none stat-number">
              {productivityScore}
            </p>
            <p className="text-[11px] text-white/30 mt-1">{getScoreLabel(productivityScore)}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-4 gap-3 mb-8 stagger-item"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        {/* Tasks stat */}
        <button
          onClick={() => onNavigate("tasks")}
          className="group flex items-center gap-4 p-4 glass-card press-effect"
        >
          <ProgressRing progress={taskProgress} color="#528BFF" size={44} strokeWidth={2.5}>
            <CheckCircle size={17} weight="regular" className="text-blue-400/70" />
          </ProgressRing>
          <div className="text-left min-w-0">
            <p className="text-[22px] font-semibold text-white/85 tabular-nums leading-none stat-number">
              {todayTasks.length + overdueTasks.length}
            </p>
            <p className="text-[11px] text-white/30 mt-1">Tasks due</p>
          </div>
        </button>

        {/* Habits stat */}
        <button
          onClick={() => onNavigate("habits")}
          className="group flex items-center gap-4 p-4 glass-card press-effect"
        >
          <ProgressRing progress={habitProgress} color="#34D399" size={44} strokeWidth={2.5}>
            <Lightning size={17} weight="regular" className="text-green-400/70" />
          </ProgressRing>
          <div className="text-left min-w-0">
            <p className="text-[22px] font-semibold text-white/85 tabular-nums leading-none stat-number">
              {habitsCompletedToday}
              <span className="text-[13px] text-white/20 font-normal">
                /{totalHabits}
              </span>
            </p>
            <p className="text-[11px] text-white/30 mt-1">Habits</p>
          </div>
        </button>

        {/* Focus stat */}
        <button
          onClick={() => onNavigate("focus")}
          className="group flex items-center gap-4 p-4 glass-card press-effect"
        >
          <ProgressRing
            progress={Math.min(focusMinutes / 120, 1)}
            color="#A78BFA"
            size={44}
            strokeWidth={2.5}
          >
            <Timer size={17} weight="regular" className="text-purple-400/70" />
          </ProgressRing>
          <div className="text-left min-w-0">
            <p className="text-[22px] font-semibold text-white/85 tabular-nums leading-none stat-number">
              {focusMinutes}
              <span className="text-[13px] text-white/20 ml-1 font-normal">m</span>
            </p>
            <p className="text-[11px] text-white/30 mt-1">Focus</p>
          </div>
        </button>

        {/* Goals stat */}
        <button
          onClick={() => onNavigate("goals")}
          className="group flex items-center gap-4 p-4 glass-card press-effect"
        >
          <ProgressRing progress={goalProgress} color="#F472B6" size={44} strokeWidth={2.5}>
            <Target size={17} weight="regular" className="text-pink-400/70" />
          </ProgressRing>
          <div className="text-left min-w-0">
            <p className="text-[22px] font-semibold text-white/85 tabular-nums leading-none stat-number">
              {activeGoals.length}
            </p>
            <p className="text-[11px] text-white/30 mt-1">Goals</p>
          </div>
        </button>
      </div>

      {/* Content cards - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Schedule card */}
        <div
          className="glass-card-static overflow-hidden stagger-item"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
            <CalendarBlank size={15} weight="regular" className="text-blue-400/50" />
            <span className="text-[12px] font-medium text-white/50">Schedule</span>
            <span className="ml-auto text-[10px] text-white/20 tabular-nums">
              {todayEvents.length} event{todayEvents.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => onNavigate("calendar")}
              className="ml-1 p-1 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all"
            >
              <ArrowRight size={12} weight="regular" />
            </button>
          </div>
          <div className="p-4">
            {todayEvents.length === 0 ? (
              <p className="text-[12px] text-white/15 text-center py-6">
                No events scheduled
              </p>
            ) : (
              <div className="space-y-1">
                {todayEvents.slice(0, 5).map((ev, i) => {
                  const isNow =
                    ev.startTime <=
                      `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}` &&
                    ev.endTime >
                      `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

                  return (
                    <div
                      key={ev.id}
                      className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 stagger-item-fast ${
                        isNow ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"
                      }`}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <div
                        className="w-[3px] shrink-0 self-stretch rounded-full min-h-[28px]"
                        style={{ background: ev.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-white/80 font-medium truncate">
                          {ev.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-white/30">
                          <Clock size={9} weight="regular" />
                          <span className="tabular-nums">
                            {ev.startTime} — {ev.endTime}
                          </span>
                          {isNow && (
                            <span className="text-[9px] text-blue-400/80 font-semibold ml-1 badge bg-blue-500/10">
                              NOW
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {todayEvents.length > 5 && (
                  <button
                    onClick={() => onNavigate("calendar")}
                    className="text-[11px] text-white/25 hover:text-white/40 transition-colors px-2 py-1"
                  >
                    +{todayEvents.length - 5} more
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tasks card */}
        <div
          className="glass-card-static overflow-hidden stagger-item"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
            <CheckCircle size={15} weight="regular" className="text-blue-400/50" />
            <span className="text-[12px] font-medium text-white/50">Tasks</span>
            <span className="ml-auto text-[10px] text-white/20 tabular-nums">
              {pendingTasks.length} pending
            </span>
            <button
              onClick={() => onNavigate("tasks")}
              className="ml-1 p-1 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all"
            >
              <ArrowRight size={12} weight="regular" />
            </button>
          </div>
          <div className="p-4">
            {[...overdueTasks, ...todayTasks].length === 0 ? (
              <div className="text-center py-6">
                <TrendUp size={18} weight="regular" className="text-green-400/30 mx-auto mb-2" />
                <p className="text-[12px] text-white/20">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {[...overdueTasks, ...todayTasks]
                  .slice(0, 6)
                  .map((task, i) => {
                    const isOverdue = !!(task.dueDate && task.dueDate < today);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-all duration-200 stagger-item-fast"
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="text-white/20 hover:text-blue-400 transition-all duration-200 shrink-0 hover:scale-110"
                        >
                          <Circle size={15} weight="regular" />
                        </button>
                        <span className="flex-1 text-[12px] text-white/60 truncate">
                          {task.title}
                        </span>
                        {task.priority === "high" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400/60 shrink-0" />
                        )}
                        {isOverdue && (
                          <span className="text-[9px] text-red-400/70 shrink-0 badge bg-red-500/10">
                            overdue
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Habits + Goals card */}
        <div
          className="glass-card-static overflow-hidden stagger-item"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
            <Lightning size={15} weight="regular" className="text-green-400/50" />
            <span className="text-[12px] font-medium text-white/50">Habits & Goals</span>
            <button
              onClick={() => onNavigate("habits")}
              className="ml-auto p-1 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-all"
            >
              <ArrowRight size={12} weight="regular" />
            </button>
          </div>
          <div className="p-4">
            {habits.length === 0 && activeGoals.length === 0 ? (
              <div className="text-center py-6">
                <Fire size={18} weight="regular" className="text-orange-400/30 mx-auto mb-2" />
                <p className="text-[12px] text-white/20">No habits or goals yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.slice(0, 4).map((habit, i) => {
                  const completed = habit.completedDates.includes(today);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center gap-2.5 stagger-item-fast"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      {(() => { const HIcon = getHabitIcon(habit.emoji); return <HIcon size={16} weight="regular" style={{ color: habit.color }} />; })()}
                      <span className={`flex-1 text-[12px] truncate ${completed ? "text-white/50 line-through" : "text-white/60"}`}>
                        {habit.name}
                      </span>
                      {completed ? (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: habit.color + "25" }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: habit.color }} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-white/[0.06]" />
                      )}
                    </div>
                  );
                })}
                {activeGoals.length > 0 && (
                  <>
                    <div className="h-px bg-white/[0.04] my-1" />
                    {activeGoals.slice(0, 2).map((goal, i) => (
                      <div key={goal.id} className="stagger-item-fast" style={{ "--i": habits.length + i } as React.CSSProperties}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Target size={11} weight="regular" className="text-pink-400/50" />
                          <span className="text-[11px] text-white/55 font-medium truncate flex-1">{goal.title}</span>
                          <span className="text-[10px] text-white/25 tabular-nums">{goal.progress}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${goal.progress}%`, background: goal.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
