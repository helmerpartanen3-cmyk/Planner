/** Task priority configuration */

import { Flag } from "@phosphor-icons/react";

export const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "#EF4444", icon: Flag },
  medium: { label: "Medium", color: "#F59E0B", icon: Flag },
  low:    { label: "Low",    color: "#528BFF", icon: Flag },
} as const;

export type FilterType = "all" | "today" | "upcoming" | "overdue" | "completed";
