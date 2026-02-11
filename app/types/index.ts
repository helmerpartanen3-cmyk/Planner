// Sovelluksen tietotyypit. Kalenteri, tehtävät, tavat ja muut alueet.

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  color: string;
  description: string;
}

// ── Tasks ───────────────────────────────────────────

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

// ── Habits ──────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  completedDates: string[];  // YYYY-MM-DD[]
  createdAt: string;
}

// ── Notes ───────────────────────────────────────────

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

// ── Focus ───────────────────────────────────────────

export interface FocusSession {
  id: string;
  duration: number;   // seconds
  completedAt: string;
  type: "work" | "break";
}

// ── Goals ───────────────────────────────────────────

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

// ── App ─────────────────────────────────────────────

export type ViewType = "today" | "calendar" | "tasks" | "habits" | "notes" | "focus" | "goals" | "weather";
