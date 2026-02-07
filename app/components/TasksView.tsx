"use client";

import { useState } from "react";
import {
  Plus,
  Trash,
  Circle,
  CheckCircle,
  CalendarBlank,
  X,
} from "@phosphor-icons/react";
import type { Task } from "../types";

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export default function TasksView({ tasks, onTasksChange }: Props) {
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [adding, setAdding] = useState(false);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

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
      },
    ]);
    setNewTitle("");
    setNewDueDate("");
    setAdding(false);
  };

  const toggleTask = (id: string) =>
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const deleteTask = (id: string) =>
    onTasksChange(tasks.filter((t) => t.id !== id));

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const formatDue = (d: string) => {
    if (!d) return null;
    const date = new Date(d + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (date.getTime() - today.getTime()) / 86_400_000
    );
    if (diff < 0)
      return { label: `${Math.abs(diff)}d overdue`, cls: "text-red-400/70" };
    if (diff === 0) return { label: "Today", cls: "text-blue-400/70" };
    if (diff === 1) return { label: "Tomorrow", cls: "text-white/40" };
    return {
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      cls: "text-white/30",
    };
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-2xl">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white/90">Tasks</h2>
          <p className="text-[12px] text-white/30 mt-0.5">
            {pending.length} pending{" "}
            {completed.length > 0 && `· ${completed.length} completed`}
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

      {/* add task form */}
      {adding && (
        <div className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="w-full px-3 py-2 text-[13px] rounded-md"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[12px] text-white/35">
              <CalendarBlank size={13} weight="light" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-2 py-1 text-[12px] rounded-md"
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={addTask}
              disabled={!newTitle.trim()}
              className="px-4 py-1.5 text-[12px] rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-default transition-all"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* task list */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {pending.length === 0 && !adding && (
          <div className="text-center mt-16">
            <p className="text-[13px] text-white/20">No pending tasks</p>
            <p className="text-[11px] text-white/15 mt-1">
              Click + to add your first task
            </p>
          </div>
        )}

        {pending.map((task) => {
          const due = formatDue(task.dueDate);
          return (
            <div
              key={task.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.035] transition-all"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="text-white/25 hover:text-blue-400 transition-colors shrink-0"
              >
                <Circle size={18} weight="light" />
              </button>
              <span className="flex-1 text-[13px] text-white/75 truncate">
                {task.title}
              </span>
              {due && (
                <span className={`text-[11px] shrink-0 ${due.cls}`}>
                  {due.label}
                </span>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.08] text-white/20 hover:text-red-400 transition-all shrink-0"
              >
                <Trash size={13} weight="light" />
              </button>
            </div>
          );
        })}

        {/* completed section */}
        {completed.length > 0 && (
          <>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 mt-4 mb-1 px-3 py-1.5 text-[11px] text-white/25 hover:text-white/40 transition-all"
            >
              <span className="text-[9px]">{showCompleted ? "▾" : "▸"}</span>
              Completed ({completed.length})
            </button>

            {showCompleted &&
              completed.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-all"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-blue-400/50 hover:text-blue-400 transition-colors shrink-0"
                  >
                    <CheckCircle size={18} weight="light" />
                  </button>
                  <span className="flex-1 text-[13px] text-white/30 line-through truncate">
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.08] text-white/20 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash size={13} weight="light" />
                  </button>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
