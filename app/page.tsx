"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar, Titlebar, CommandPalette } from "./components/layout";
import { TodayView } from "./features/today";
import { CalendarView } from "./features/calendar";
import { TasksView } from "./features/tasks";
import { HabitsView } from "./features/habits";
import { NotesView } from "./features/notes";
import { FocusView } from "./features/focus";
import { GoalsView } from "./features/goals";
import { WeatherView } from "./features/weather";
import { useLocalStorage } from "./hooks";
import { DEFAULT_NAV_ORDER } from "./config";
import type { ViewType, CalendarEvent, Task, Habit, Note, FocusSession, Goal } from "./types";

export default function Home() {
  const [navOrderRaw, setNavOrder, navHydrated] = useLocalStorage<ViewType[]>(
    "clarity-nav-order",
    DEFAULT_NAV_ORDER
  );

  // Ensure persisted order always includes all default items and no stale ones
  const navOrder = (() => {
    const valid = navOrderRaw.filter((id) => DEFAULT_NAV_ORDER.includes(id));
    const missing = DEFAULT_NAV_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  })();

  // Persist the corrected order if it differs
  useEffect(() => {
    if (
      navOrder.length !== navOrderRaw.length ||
      navOrder.some((id, i) => id !== navOrderRaw[i])
    ) {
      setNavOrder(navOrder);
    }
  }, [navOrder, navOrderRaw, setNavOrder]);

  const [view, setView] = useState<ViewType | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>("clarity-events", []);
  const [tasks, setTasks] = useLocalStorage<Task[]>("clarity-tasks", []);
  const [habits, setHabits] = useLocalStorage<Habit[]>("clarity-habits", []);
  const [notes, setNotes] = useLocalStorage<Note[]>("clarity-notes", []);
  const [focusSessions, setFocusSessions] = useLocalStorage<FocusSession[]>("clarity-focus-sessions", []);
  const [goals, setGoals] = useLocalStorage<Goal[]>("clarity-goals", []);

  // Set the startup view to the first item in the persisted order (wait for hydration)
  useEffect(() => {
    if (view === null && navHydrated && navOrder.length > 0) {
      setView(navOrder[0]);
    }
  }, [navOrder, navHydrated, view]);

  // Ctrl+K command palette shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleQuickAdd = useCallback(
    (type: string) => {
      if (type === "task") {
        setView("tasks");
      } else if (type === "event") {
        setView("calendar");
      } else if (type === "note") {
        setView("notes");
      } else if (type === "habit") {
        setView("habits");
      }
    },
    []
  );

  const currentView = view ?? navOrder[0] ?? "today";

  return (
    <div className="flex h-screen select-none relative">
      <Sidebar
        currentView={currentView}
        onViewChange={setView}
        navOrder={navOrder}
        onNavOrderChange={setNavOrder}
        isWeather={currentView === "weather"}
        onCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Titlebar isWeather={currentView === "weather"} />

        <main className="flex-1 overflow-hidden">
          <div key={currentView} className="h-full">
            {currentView === "today" && (
              <TodayView
                events={events}
                tasks={tasks}
                habits={habits}
                goals={goals}
                focusSessions={focusSessions}
                onTasksChange={setTasks}
                onNavigate={setView}
              />
            )}
            {currentView === "calendar" && (
              <CalendarView events={events} onEventsChange={setEvents} />
            )}
            {currentView === "tasks" && (
              <TasksView tasks={tasks} onTasksChange={setTasks} />
            )}
            {currentView === "habits" && (
              <HabitsView habits={habits} setHabits={setHabits} />
            )}
            {currentView === "notes" && (
              <NotesView notes={notes} onNotesChange={setNotes} />
            )}
            {currentView === "focus" && (
              <FocusView sessions={focusSessions} onSessionsChange={setFocusSessions} />
            )}
            {currentView === "goals" && (
              <GoalsView goals={goals} setGoals={setGoals} />
            )}
            {currentView === "weather" && <WeatherView />}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(v) => {
          setView(v);
          setCommandPaletteOpen(false);
        }}
        onQuickAdd={(type) => {
          handleQuickAdd(type);
          setCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}
