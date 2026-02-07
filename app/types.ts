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
  priority?: "low" | "medium" | "high";
  category?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  completedDates: string[];  // YYYY-MM-DD[]
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  duration: number;   // seconds
  completedAt: string;
  type: "work" | "break";
}

export type ViewType = "today" | "calendar" | "tasks" | "habits" | "notes" | "focus" | "weather";
