/** Calendar-specific constants */

import { APP_COLORS } from "../../config";

export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAYS_NARROW = ["M", "T", "W", "T", "F", "S", "S"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const EVENT_COLORS = APP_COLORS;
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT = 56;
