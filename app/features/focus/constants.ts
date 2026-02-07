/** Focus/Pomodoro timer configuration */

import { Lightning, Coffee } from "@phosphor-icons/react";

export const MODES = {
  work:       { label: "Focus",       duration: 25 * 60, color: "#528BFF", icon: Lightning },
  shortBreak: { label: "Short Break", duration: 5 * 60,  color: "#34D399", icon: Coffee },
  longBreak:  { label: "Long Break",  duration: 15 * 60, color: "#A78BFA", icon: Coffee },
} as const;

export type ModeKey = keyof typeof MODES;
