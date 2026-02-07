export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  color: string;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;    // YYYY-MM-DD or ""
  createdAt: string;
}

export type ViewType = "today" | "calendar" | "tasks" | "weather";
