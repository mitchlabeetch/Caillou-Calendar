import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CalendarEvent } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasSchedulingConflict = (e1: CalendarEvent, e2: CalendarEvent) => {
  if (e1.date !== e2.date) return false;
  if (!e1.memberIds.some(id => e2.memberIds.includes(id))) return false;
  const s1 = e1.startTime || "00:00";
  const e1End = e1.endTime || s1;
  const s2 = e2.startTime || "00:00";
  const e2End = e2.endTime || s2;
  return (
    (s1 >= s2 && s1 < e2End) ||
    (e1End > s2 && e1End <= e2End) ||
    (s1 <= s2 && e1End >= e2End)
  );
};

export const getConflictsForEvent = (event: CalendarEvent, allEvents: CalendarEvent[]) => {
  return allEvents.filter(e => e.id !== event.id && hasSchedulingConflict(event, e));
};
