"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  X,
  Trash,
  Circle,
  CheckCircle,
  CaretDown,
  CaretRight,
  CalendarBlank,
  Flag,
  FunnelSimple,
  ListChecks,
  TrendUp,
  Lightning,
} from "@phosphor-icons/react";
import { APP_COLORS } from "../../config";
import type { Task, SubTask } from "../../types";
import { PRIORITY_CONFIG } from "./constants";
import type { FilterType } from "./constants";
import { todayStr } from "../../lib";

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export default function TasksView({ tasks, onTasksChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    title: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
  });
  const [subtaskInput, setSubtaskInput] = useState<Record<string, string>>({});

  const today = todayStr();

  const filtered = useMemo(() => {
    let list = [...tasks];

    switch (filter) {
      case "today":
        list = list.filter((t) => !t.completed && t.dueDate === today);
        break;
      case "upcoming":
        list = list.filter((t) => !t.completed && t.dueDate && t.dueDate > today);
        break;
      case "overdue":
        list = list.filter((t) => !t.completed && t.dueDate && t.dueDate < today);
        break;
      case "completed":
        list = list.filter((t) => t.completed);
        break;
      default:
        list = list.filter((t) => !t.completed);
    }

    // Sort: overdue first, then by priority, then by date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => {
      if (!a.completed && !b.completed) {
        const aOverdue = a.dueDate && a.dueDate < today ? -1 : 0;
        const bOverdue = b.dueDate && b.dueDate < today ? -1 : 0;
        if (aOverdue !== bOverdue) return aOverdue - bOverdue;
        const ap = priorityOrder[a.priority || "medium"];
        const bp = priorityOrder[b.priority || "medium"];
        if (ap !== bp) return ap - bp;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, filter, today]);

  // Stats
  const totalOpen = tasks.filter((t) => !t.completed).length;
  const dueToday = tasks.filter((t) => !t.completed && t.dueDate === today).length;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const addTask = () => {
    if (!form.title.trim()) return;
    onTasksChange([
      ...tasks,
      {
        id: Date.now().toString(),
        title: form.title.trim(),
        completed: false,
        dueDate: form.dueDate,
        createdAt: new Date().toISOString(),
        priority: form.priority,
        subtasks: [],
      },
    ]);
    setForm({ title: "", dueDate: "", priority: "medium" });
    setAdding(false);
  };

  const toggleTask = (id: string) => {
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    onTasksChange(tasks.filter((t) => t.id !== id));
  };

  const toggleExpanded = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Subtask operations
  const addSubtask = (taskId: string) => {
    const title = subtaskInput[taskId]?.trim();
    if (!title) return;
    onTasksChange(
      tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newSub: SubTask = { id: Date.now().toString(), title, completed: false };
        return { ...t, subtasks: [...(t.subtasks || []), newSub] };
      })
    );
    setSubtaskInput((prev) => ({ ...prev, [taskId]: "" }));
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    onTasksChange(
      tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: (t.subtasks || []).map((s) =>
            s.id === subId ? { ...s, completed: !s.completed } : s
          ),
        };
      })
    );
  };

  const deleteSubtask = (taskId: string, subId: string) => {
    onTasksChange(
      tasks.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subId) };
      })
    );
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Active", count: totalOpen },
    { key: "today", label: "Today", count: dueToday },
    { key: "overdue", label: "Overdue", count: overdue },
    { key: "upcoming", label: "Upcoming", count: tasks.filter((t) => !t.completed && t.dueDate && t.dueDate > today).length },
    { key: "completed", label: "Done", count: completedCount },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 animate-viewEnter">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gradient">Tasks</h2>
              <p className="text-[12px] text-white/30 mt-0.5">
                {totalOpen} active · {overdue > 0 ? `${overdue} overdue` : "none overdue"}
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
              {adding ? "Cancel" : "New Task"}
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-1 mb-5">
            <FunnelSimple size={13} weight="regular" className="text-white/20 mr-1" />
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                  filter === f.key
                    ? "bg-white/[0.08] text-white/80"
                    : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`ml-1.5 ${filter === f.key ? "text-white/50" : "text-white/20"}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add task form */}
          {adding && (
            <div className="mb-5 p-5 glass-card-static space-y-3 animate-slideDown">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[13px] text-white/90 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <CalendarBlank size={12} weight="regular" className="text-white/25" />
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="px-3 py-2 text-[12px] rounded-xl bg-white/5 border border-white/8 text-white/60 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`px-2.5 py-1 text-[10px] rounded-lg font-medium transition-all ${
                        form.priority === p
                          ? "text-white/80"
                          : "text-white/25 hover:text-white/40"
                      }`}
                      style={
                        form.priority === p
                          ? { background: PRIORITY_CONFIG[p].color + "20", color: PRIORITY_CONFIG[p].color }
                          : undefined
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex-1" />
                <button
                  onClick={addTask}
                  disabled={!form.title.trim()}
                  className="px-5 py-2 text-[12px] rounded-xl bg-[#528BFF]/20 text-[#528BFF] hover:bg-[#528BFF]/30 disabled:opacity-25 disabled:cursor-default transition-all font-medium"
                >
                  Add Task
                </button>
              </div>
            </div>
          )}

          {/* Task list */}
          <div className="space-y-1">
            {filtered.length === 0 && (
              <div className="text-center mt-16">
                <ListChecks size={28} weight="regular" className="text-white/10 mx-auto mb-3" />
                <p className="text-[13px] text-white/20">
                  {filter === "completed" ? "No completed tasks" : "No tasks here"}
                </p>
                <p className="text-[11px] text-white/15 mt-1">
                  {filter === "all" ? "Click + to add your first task" : "Try a different filter"}
                </p>
              </div>
            )}

            {filtered.map((task, idx) => {
              const isOverdue = !!(task.dueDate && task.dueDate < today && !task.completed);
              const priority = task.priority || "medium";
              const PriorityIcon = PRIORITY_CONFIG[priority].icon;
              const hasSubtasks = (task.subtasks || []).length > 0;
              const isExpanded = expandedTasks.has(task.id);
              const completedSubs = (task.subtasks || []).filter((s) => s.completed).length;
              const totalSubs = (task.subtasks || []).length;

              return (
                <div
                  key={task.id}
                  className="stagger-item"
                  style={{ "--i": idx } as React.CSSProperties}
                >
                  <div
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      task.completed
                        ? "opacity-50 hover:opacity-70"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Expand button or spacer */}
                    <button
                      onClick={() => toggleExpanded(task.id)}
                      className={`w-4 h-4 flex items-center justify-center shrink-0 transition-all ${
                        hasSubtasks ? "text-white/25 hover:text-white/40" : "text-transparent"
                      }`}
                    >
                      {hasSubtasks ? (
                        isExpanded ? <CaretDown size={10} weight="bold" /> : <CaretRight size={10} weight="bold" />
                      ) : (
                        <span className="w-2" />
                      )}
                    </button>

                    {/* Toggle completion */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`shrink-0 transition-all duration-200 hover:scale-110 ${
                        task.completed
                          ? "text-green-400/60"
                          : "text-white/20 hover:text-blue-400"
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle size={18} weight="fill" />
                      ) : (
                        <Circle size={18} weight="regular" />
                      )}
                    </button>

                    {/* Title */}
                    <span
                      className={`flex-1 text-[13px] truncate ${
                        task.completed
                          ? "text-white/35 line-through"
                          : "text-white/75"
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Subtask count */}
                    {hasSubtasks && !task.completed && (
                      <span className="text-[10px] text-white/20 tabular-nums">
                        {completedSubs}/{totalSubs}
                      </span>
                    )}

                    {/* Priority badge */}
                    {!task.completed && (
                      <PriorityIcon
                        size={12}
                        weight={priority === "high" ? "fill" : "light"}
                        style={{ color: PRIORITY_CONFIG[priority].color + (priority === "high" ? "" : "80") }}
                        className="shrink-0"
                      />
                    )}

                    {/* Due date */}
                    {task.dueDate && !task.completed && (
                      <span
                        className={`text-[10px] shrink-0 tabular-nums badge ${
                          isOverdue
                            ? "text-red-400/80 bg-red-500/10"
                            : task.dueDate === today
                            ? "text-blue-400/70 bg-blue-500/10"
                            : "text-white/25 bg-white/[0.03]"
                        }`}
                      >
                        {isOverdue
                          ? "Overdue"
                          : task.dueDate === today
                          ? "Today"
                          : new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/[0.08] text-white/20 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash size={13} weight="regular" />
                    </button>
                  </div>

                  {/* Subtasks expanded */}
                  {isExpanded && !task.completed && (
                    <div className="ml-11 pl-4 border-l border-white/[0.04] mb-2 animate-slideDown">
                      {(task.subtasks || []).map((sub, si) => (
                        <div
                          key={sub.id}
                          className="group/sub flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-all stagger-item-fast"
                          style={{ "--i": si } as React.CSSProperties}
                        >
                          <button
                            onClick={() => toggleSubtask(task.id, sub.id)}
                            className={`shrink-0 transition-all ${
                              sub.completed
                                ? "text-green-400/50"
                                : "text-white/15 hover:text-blue-400/60"
                            }`}
                          >
                            {sub.completed ? (
                              <CheckCircle size={14} weight="fill" />
                            ) : (
                              <Circle size={14} weight="regular" />
                            )}
                          </button>
                          <span
                            className={`flex-1 text-[12px] ${
                              sub.completed ? "text-white/25 line-through" : "text-white/55"
                            }`}
                          >
                            {sub.title}
                          </span>
                          <button
                            onClick={() => deleteSubtask(task.id, sub.id)}
                            className="opacity-0 group-hover/sub:opacity-100 p-0.5 text-white/15 hover:text-red-400 transition-all"
                          >
                            <Trash size={10} weight="regular" />
                          </button>
                        </div>
                      ))}

                      {/* Add subtask */}
                      <div className="flex items-center gap-2 mt-1 px-2">
                        <Plus size={11} weight="regular" className="text-white/15 shrink-0" />
                        <input
                          type="text"
                          placeholder="Add subtask..."
                          value={subtaskInput[task.id] || ""}
                          onChange={(e) =>
                            setSubtaskInput((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && addSubtask(task.id)}
                          className="flex-1 text-[11px] !bg-transparent !border-none !p-0 !shadow-none text-white/40 placeholder:text-white/15 !outline-none !ring-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel - stats */}
        <div className="w-56 shrink-0 hidden lg:flex flex-col gap-4">
          {/* Overview card */}
          <div className="glass-card-static p-5">
            <h3 className="text-[11px] font-semibold text-white/30 mb-4 uppercase tracking-wider">
              Overview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/35">Active</span>
                <span className="text-[15px] font-semibold text-white/75 tabular-nums">{totalOpen}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/35">Due today</span>
                <span className="text-[15px] font-semibold text-blue-400/80 tabular-nums">{dueToday}</span>
              </div>
              {overdue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/35">Overdue</span>
                  <span className="text-[15px] font-semibold text-red-400/80 tabular-nums">{overdue}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/35">Completed</span>
                <span className="text-[15px] font-semibold text-green-400/80 tabular-nums">{completedCount}</span>
              </div>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="glass-card-static p-5">
            <h3 className="text-[11px] font-semibold text-white/30 mb-4 uppercase tracking-wider">
              Priority
            </h3>
            <div className="space-y-3">
              {(["high", "medium", "low"] as const).map((p) => {
                const count = tasks.filter((t) => !t.completed && (t.priority || "medium") === p).length;
                const maxCount = Math.max(1, totalOpen);
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: PRIORITY_CONFIG[p].color }}
                        />
                        <span className="text-[11px] text-white/40 capitalize">{p}</span>
                      </div>
                      <span className="text-[11px] text-white/50 tabular-nums font-medium">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          background: PRIORITY_CONFIG[p].color + "60",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Productivity tip */}
          <div className="glass-card-accent p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightning size={12} weight="fill" className="text-[#528BFF]/70" />
              <span className="text-[10px] font-semibold text-[#528BFF]/60 uppercase tracking-wider">Tip</span>
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed">
              Break large tasks into subtasks to make progress more visible and stay motivated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
