/**
 * Shared icon system for habits and other features.
 *
 * Centralizes icon options so multiple features (HabitsView, TodayView)
 * can reference habit icons without cross-feature imports.
 */
import {
  Barbell,
  BookOpen,
  Flower,
  Drop,
  PersonSimpleRun,
  Target,
  PencilLine,
  Brain,
  MoonStars,
  ForkKnife,
  MusicNote,
  Laptop,
  Plant,
  Lightning,
  Fire,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export const ICON_OPTIONS: { key: string; icon: Icon; label: string }[] = [
  { key: "barbell",   icon: Barbell,         label: "Workout" },
  { key: "book",      icon: BookOpen,        label: "Reading" },
  { key: "flower",    icon: Flower,          label: "Meditate" },
  { key: "drop",      icon: Drop,            label: "Hydrate" },
  { key: "run",       icon: PersonSimpleRun, label: "Running" },
  { key: "target",    icon: Target,          label: "Goals" },
  { key: "pencil",    icon: PencilLine,      label: "Writing" },
  { key: "brain",     icon: Brain,           label: "Study" },
  { key: "moon",      icon: MoonStars,       label: "Sleep" },
  { key: "apple",     icon: ForkKnife,       label: "Nutrition" },
  { key: "music",     icon: MusicNote,       label: "Music" },
  { key: "laptop",    icon: Laptop,          label: "Code" },
  { key: "plant",     icon: Plant,           label: "Growth" },
  { key: "lightning",  icon: Lightning,       label: "Energy" },
  { key: "fire",      icon: Fire,            label: "Streak" },
];

/** Lookup a habit icon by key, with fallback to Barbell */
export function getHabitIcon(key: string): Icon {
  return ICON_OPTIONS.find((o) => o.key === key)?.icon ?? Barbell;
}
