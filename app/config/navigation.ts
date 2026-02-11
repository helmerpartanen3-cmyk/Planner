// Navigaation konfiguraatio ja metadata näkymille.

import {
  CalendarBlank,
  CalendarDot,
  CloudSun,
  Lightning,
  Notepad,
  Timer,
  CheckSquare,
  Target,
} from "@phosphor-icons/react";
import type { ViewType } from "../types";

export const DEFAULT_NAV_ORDER: ViewType[] = [
  "today",
  "calendar",
  "tasks",
  "habits",
  "notes",
  "focus",
  "goals",
  "weather",
];

/** Visual metadata for each navigation view */
export const NAV_META: Record<
  ViewType,
  { label: string; icon: typeof CalendarDot; accent: string }
> = {
  today:    { label: "Today",    icon: CalendarDot,  accent: "#528BFF" },
  calendar: { label: "Calendar", icon: CalendarBlank, accent: "#528BFF" },
  tasks:    { label: "Tasks",    icon: CheckSquare,   accent: "#528BFF" },
  habits:   { label: "Habits",   icon: Lightning,     accent: "#34D399" },
  notes:    { label: "Notes",    icon: Notepad,       accent: "#A78BFA" },
  focus:    { label: "Focus",    icon: Timer,         accent: "#F59E0B" },
  goals:    { label: "Goals",    icon: Target,        accent: "#F472B6" },
  weather:  { label: "Weather",  icon: CloudSun,      accent: "#14B8A6" },
};

export interface NavSection {
  label: string;
  items: ViewType[];
}

/** Sidebar section groupings */
export const SECTIONS: NavSection[] = [
  { label: "Overview", items: ["today", "calendar", "tasks"] },
  { label: "Growth",   items: ["habits", "notes", "focus", "goals"] },
  { label: "Live",     items: ["weather"] },
];
