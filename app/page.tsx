"use client";

import { useEffect, useState } from "react";
import Sidebar, { DEFAULT_NAV_ORDER } from "./components/Sidebar";
import Titlebar from "./components/Titlebar";
import CalendarView from "./components/CalendarView";
import TasksView from "./components/TasksView";
import TodayView from "./components/TodayView";
import WeatherView from "./components/WeatherView";
import HabitsView from "./components/HabitsView";
import NotesView from "./components/NotesView";
import FocusView from "./components/FocusView";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { ViewType, CalendarEvent, Task, Habit, Note, FocusSession } from "./types";

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
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>(
    "clarity-events",
    []
  );
  const [tasks, setTasks] = useLocalStorage<Task[]>("clarity-tasks", []);
  const [habits, setHabits] = useLocalStorage<Habit[]>("clarity-habits", []);
  const [notes, setNotes] = useLocalStorage<Note[]>("clarity-notes", []);
  const [focusSessions, setFocusSessions] = useLocalStorage<FocusSession[]>(
    "clarity-focus-sessions",
    []
  );

  // Set the startup view to the first item in the persisted order (wait for hydration)
  useEffect(() => {
    if (view === null && navHydrated && navOrder.length > 0) {
      setView(navOrder[0]);
    }
  }, [navOrder, navHydrated, view]);

  const currentView = view ?? navOrder[0] ?? "today";

  return (
    <div className="flex h-screen select-none relative">
      <Sidebar
        currentView={currentView}
        onViewChange={setView}
        navOrder={navOrder}
        onNavOrderChange={setNavOrder}
        isWeather={currentView === "weather"}
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
              <HabitsView habits={habits} onHabitsChange={setHabits} />
            )}
            {currentView === "notes" && (
              <NotesView notes={notes} onNotesChange={setNotes} />
            )}
            {currentView === "focus" && (
              <FocusView
                sessions={focusSessions}
                onSessionsChange={setFocusSessions}
              />
            )}
            {currentView === "weather" && <WeatherView />}
          </div>
        </main>
      </div>
    </div>
  );
}
