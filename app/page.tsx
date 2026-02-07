"use client";

import { useEffect, useState } from "react";
import Sidebar, { DEFAULT_NAV_ORDER } from "./components/Sidebar";
import Titlebar from "./components/Titlebar";
import CalendarView from "./components/CalendarView";
import TasksView from "./components/TasksView";
import TodayView from "./components/TodayView";
import WeatherView from "./components/WeatherView";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { ViewType, CalendarEvent, Task } from "./types";

export default function Home() {
  const [navOrderRaw, setNavOrder] = useLocalStorage<ViewType[]>(
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

  // Set the startup view to the first item in the persisted order
  useEffect(() => {
    if (view === null && navOrder.length > 0) {
      setView(navOrder[0]);
    }
  }, [navOrder, view]);

  const currentView = view ?? navOrder[0] ?? "today";

  return (
    <div className="flex h-screen select-none">
      <Sidebar
        currentView={currentView}
        onViewChange={setView}
        navOrder={navOrder}
        onNavOrderChange={setNavOrder}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Titlebar />

        <main className="flex-1 overflow-hidden">
          {currentView === "today" && (
            <TodayView
              events={events}
              tasks={tasks}
              onTasksChange={setTasks}
            />
          )}
          {currentView === "calendar" && (
            <CalendarView events={events} onEventsChange={setEvents} />
          )}
          {currentView === "tasks" && (
            <TasksView tasks={tasks} onTasksChange={setTasks} />
          )}
          {currentView === "weather" && <WeatherView />}
        </main>
      </div>
    </div>
  );
}
