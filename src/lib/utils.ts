import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns today's date (or any Date) as a local YYYY-MM-DD string.
 * NEVER uses toISOString() which would return the UTC date and shift
 * dates by one day for users in UTC+ timezones (e.g. Germany, UTC+1/+2).
 *
 * Use this everywhere you need "today" or a date as a storage key.
 */
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
