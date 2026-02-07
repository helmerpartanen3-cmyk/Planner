"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Trash,
  Circle,
  CheckCircle,
  CalendarBlank,
  X,
  FunnelSimple,
  CheckSquare,
} from "@phosphor-icons/react";
import type { Task } from "../types";

const PRIORITY_CONFIG = {
  high: { label: "High", color: "#F87171", dot: "bg-red-400" },
  medium: { label: "Medium", color: "#FB923C", dot: "bg-orange-400" },
  low: { label: "Low", color: "#528BFF", dot: "bg-blue-400" },
} as const;

type PriorityFilter = "all" | "high" | "medium" | "low";

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export default function TasksView({ tasks, onTasksChange }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [showCompleted, setShowCompleted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<PriorityFilter>("all");

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const addTask = () => {
    if (!newTitle.trim()) return;
    onTasksChange([
      ...tasks,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        completed: false,
        dueDate: newDueDate || "",
        createdAt: new Date().toISOString(),
        priority: newPriority,
      },
    ]);
    setNewTitle("");
    setNewDueDate("");
    setNewPriority("medium");
    setAdding(false);
  };

  const toggleTask = (id: string) =>
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const deleteTask = (id: string) =>
    onTasksChange(tasks.filter((t) => t.id !== id));

  const allPending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  // Apply filter
  const pending = useMemo(() => {
    let list = allPending;
    if (filter !== "all") {
      list = list.filter((t) => (t.priority || "medium") === filter);
    }
    // Sort: overdue first, then by priority (high > medium > low), then by due date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...list].sort((a, b) => {
      const aOverdue = a.dueDate && a.dueDate < todayStr ? -1 : 0;
      const bOverdue = b.dueDate && b.dueDate < todayStr ? -1 : 0;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const aPri = priorityOrder[a.priority || "medium"];
      const bPri = priorityOrder[b.priority || "medium"];
      if (aPri !== bPri) return aPri - bPri;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [allPending, filter, todayStr]);

  const formatDue = (d: string) => {
    if (!d) return null;
    const date = new Date(d + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
    if (diff < 0)
      return { label: `${Math.abs(diff)}d overdue`, cls: "text-red-400/70" };
    if (diff === 0) return { label: "Today", cls: "text-blue-400/70" };
    if (diff === 1) return { label: "Tomorrow", cls: "text-white/40" };
    if (diff <= 7) return { label: `${diff}d`, cls: "text-white/30" };
    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      cls: "text-white/30",
    };
  };

  return (
    <div className="flex flex-col h-full p-6 animate-viewEnter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white/90">Tasks</h2>
          <p className="text-[12px] text-white/30 mt-0.5">
            {allPending.length} pending
            {completed.length > 0 && ` · ${completed.length} completed`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1 text-[11px] rounded-md transition-all ${
                filter === "all"
                  ? "bg-white/[0.07] text-white/70"
                  : "text-white/25 hover:text-white/45"
              }`}
            >
              All
            </button>
            {(["high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilter(filter === p ? "all" : p)}
                className={`px-2 py-1 text-[11px] rounded-md transition-all flex items-center gap-1.5 ${
                  filter === p
                    ? "bg-white/[0.07] text-white/70"
                    : "text-white/25 hover:text-white/45"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`}
                  style={{ opacity: filter === p ? 1 : 0.5 }}
                />
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAdding(!adding)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              adding
                ? "bg-white/[0.08] text-white/60"
                : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
            }`}
          >
            {adding ? (
              <X size={15} weight="light" />
            ) : (
              <Plus size={15} weight="light" />
            )}
          </button>
        </div>
      </div>

      {/* Add task form */}
      {adding && (
        <div className="mb-5 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3 animate-slideDown">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="w-full px-3 py-2 text-[13px] rounded-full"
            autoFocus
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[12px] text-white/35">
              <CalendarBlank size={13} weight="light" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-2 py-1 text-[12px] rounded-full"
              />
            </div>

            {/* Priority selector */}
            <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-0.5">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={`px-2.5 py-1.5 text-[11px] rounded-md transition-all flex items-center gap-1.5 ${
                    newPriority === p
                      ? "bg-white/[0.07] text-white/70"
                      : "text-white/25 hover:text-white/45"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`}
                    style={{ opacity: newPriority === p ? 1 : 0.4 }}
                  />
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>

            <div className="flex-1" />
            <button
              onClick={addTask}
              disabled={!newTitle.trim()}
              className="px-5 py-2 text-[12px] rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-default transition-all font-medium"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Task list */}
        <div className="flex-1 overflow-y-auto min-w-0">
        <div className="space-y-0.5">
        {pending.length === 0 && !adding && (
          <div className="text-center mt-16">
            <CheckSquare
              size={32}
              weight="light"
              className="text-white/10 mx-auto mb-3"
            />
            <p className="text-[13px] text-white/20">
              {filter !== "all" ? "No matching tasks" : "No pending tasks"}
            </p>
            <p className="text-[11px] text-white/15 mt-1">
              {filter !== "all"
                ? "Try changing the filter"
                : "Click + to add your first task"}
            </p>
          </div>
        )}

        {pending.map((task, idx) => {
          const due = formatDue(task.dueDate);
          const priority = task.priority || "medium";

          return (
            <div
              key={task.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.035] transition-all duration-200 stagger-item"
              style={{ "--i": idx } as React.CSSProperties}
            >
              {/* Priority dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_CONFIG[priority].dot}`}
                style={{ opacity: 0.6 }}
              />

              {/* Toggle */}
              <button
                onClick={() => toggleTask(task.id)}
                className="text-white/20 hover:text-blue-400 transition-all duration-200 shrink-0 hover:scale-110"
              >
                <Circle size={18} weight="light" />
              </button>

              {/* Title */}
              <span className="flex-1 text-[13px] text-white/70 truncate">
                {task.title}
              </span>

              {/* Due date */}
              {due && (
                <span
                  className={`text-[11px] shrink-0 tabular-nums ${due.cls}`}
                >
                  {due.label}
                </span>
              )}

              {/* Delete */}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/[0.08] text-white/20 hover:text-red-400 transition-all shrink-0"
              >
                <Trash size={13} weight="light" />
              </button>
            </div>
          );
        })}

        {/* Completed section */}
        {completed.length > 0 && (
          <>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 mt-5 mb-1 px-3 py-1.5 text-[11px] text-white/25 hover:text-white/40 transition-all"
            >
              <span
                className="text-[8px] transition-transform duration-200"
                style={{
                  display: "inline-block",
                  transform: showCompleted ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ▶
              </span>
              Completed ({completed.length})
            </button>

            {showCompleted && (
              <div className="space-y-0.5 animate-slideDown">
                {completed.map((task, idx) => (
                  <div
                    key={task.id}
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.025] transition-all duration-200 stagger-item-fast"
                    style={{ "--i": idx } as React.CSSProperties}
                  >
                    <span className="w-1.5 shrink-0" />
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="text-blue-400/40 hover:text-blue-400 transition-all shrink-0"
                    >
                      <CheckCircle size={18} weight="light" />
                    </button>
                    <span className="flex-1 text-[13px] text-white/25 line-through truncate">
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/[0.08] text-white/20 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash size={13} weight="light" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
        </div>

        {/* Side panel - stats */}
        <div className="w-64 shrink-0 hidden lg:flex flex-col gap-4">
          {/* Overview card */}
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5">
            <h3 className="text-[12px] font-medium text-white/40 mb-4 uppercase tracking-wider">Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/35">Pending</span>
                <span className="text-[15px] font-semibold text-white/75 tabular-nums">{allPending.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/35">Completed</span>
                <span className="text-[15px] font-semibold text-white/75 tabular-nums">{completed.length}</span>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/35">Total</span>
                <span className="text-[15px] font-semibold text-white/75 tabular-nums">{tasks.length}</span>
              </div>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5">
            <h3 className="text-[12px] font-medium text-white/40 mb-4 uppercase tracking-wider">By priority</h3>
            <div className="space-y-3">
              {(["high", "medium", "low"] as const).map((p) => {
                const count = allPending.filter((t) => (t.priority || "medium") === p).length;
                const pct = allPending.length > 0 ? (count / allPending.length) * 100 : 0;
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} style={{ opacity: 0.7 }} />
                        <span className="text-[12px] text-white/45">{PRIORITY_CONFIG[p].label}</span>
                      </div>
                      <span className="text-[12px] font-medium text-white/55 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: PRIORITY_CONFIG[p].color, opacity: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
