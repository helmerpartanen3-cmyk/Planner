export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  color: string;
  description: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;    // YYYY-MM-DD or ""
  createdAt: string;
  priority?: "low" | "medium" | "high";
  category?: string;
  subtasks?: SubTask[];
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
  tags?: string[];
}

export interface FocusSession {
  id: string;
  duration: number;   // seconds
  completedAt: string;
  type: "work" | "break";
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  color: string;
  targetDate?: string; // YYYY-MM-DD
  progress: number;    // 0-100
  milestones: Milestone[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export type ViewType = "today" | "calendar" | "tasks" | "habits" | "notes" | "focus" | "goals" | "weather";

export const APP_COLORS = [
  "#528BFF", // blue – primary, calm and trustworthy
  "#34D399", // green – success / progress
  "#A78BFA", // violet – creative / personal
  "#F59E0B", // amber – attention / reminders
  "#EF4444", // red – urgent / overdue
  "#14B8A6", // teal – balance / habits
  "#F472B6", // pink – notes / highlights
];
