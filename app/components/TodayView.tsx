"use client";

import {
  Clock,
  CheckCircle,
  Circle,
  CalendarBlank,
} from "@phosphor-icons/react";
import type { CalendarEvent, Task } from "../types";

interface Props {
  events: CalendarEvent[];
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TodayView({ events, tasks, onTasksChange }: Props) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const pendingTasks = tasks.filter((t) => !t.completed);
  const overdueTasks = pendingTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr
  );
  const todayTasks = pendingTasks.filter((t) => t.dueDate === todayStr);
  const upcomingTasks = pendingTasks.filter(
    (t) => !t.dueDate || t.dueDate > todayStr
  );
  const displayTasks = [
    ...overdueTasks,
    ...todayTasks,
    ...upcomingTasks.slice(0, 5),
  ];

  const toggleTask = (id: string) =>
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* greeting */}
      <div className="mb-8">
        <p className="text-[13px] text-white/35 mb-1">{getGreeting()}</p>
        <h1 className="text-2xl font-semibold text-white/90">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h1>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* events card */}
        <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center gap-2">
            <CalendarBlank size={15} weight="light" className="text-white/35" />
            <span className="text-[13px] font-medium text-white/60">
              Today&apos;s Events
            </span>
            <span className="ml-auto text-[11px] text-white/25">
              {todayEvents.length}
            </span>
          </div>
          <div className="p-4 space-y-1.5">
            {todayEvents.length === 0 ? (
              <p className="text-[13px] text-white/20 text-center py-6">
                No events today
              </p>
            ) : (
              todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-all"
                >
                  <div
                    className="w-[3px] shrink-0 self-stretch rounded-full"
                    style={{ background: ev.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] text-white/80 font-medium truncate">
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/30">
                      <Clock size={11} weight="light" />
                      {ev.startTime} — {ev.endTime}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* tasks card */}
        <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center gap-2">
            <CheckCircle size={15} weight="light" className="text-white/35" />
            <span className="text-[13px] font-medium text-white/60">
              Pending Tasks
            </span>
            <span className="ml-auto text-[11px] text-white/25">
              {pendingTasks.length}
            </span>
          </div>
          <div className="p-4 space-y-0.5">
            {displayTasks.length === 0 ? (
              <p className="text-[13px] text-white/20 text-center py-6">
                All caught up!
              </p>
            ) : (
              displayTasks.map((task) => {
                const isOverdue = !!(task.dueDate && task.dueDate < todayStr);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-all"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="text-white/25 hover:text-blue-400 transition-colors shrink-0"
                    >
                      <Circle size={16} weight="light" />
                    </button>
                    <span className="flex-1 text-[13px] text-white/70 truncate">
                      {task.title}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] text-red-400/70 shrink-0">
                        overdue
                      </span>
                    )}
                    {task.dueDate === todayStr && (
                      <span className="text-[10px] text-blue-400/60 shrink-0">
                        today
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
