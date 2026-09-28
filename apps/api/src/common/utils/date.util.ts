export interface DayBounds {
  startOfToday: Date;
  endOfToday: Date;
}

/** Returns the [start, end) boundaries of the reference day in the server timezone. */
export function getDayBounds(reference: Date = new Date()): DayBounds {
  const startOfToday = new Date(reference);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  return { startOfToday, endOfToday };
}

export interface MonthBounds {
  startOfMonth: Date;
  endOfMonth: Date;
}

/** Returns the [start, end) boundaries of the reference month. */
export function getMonthBounds(reference: Date = new Date()): MonthBounds {
  const startOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const endOfMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { startOfMonth, endOfMonth };
}

/** Returns a Date at 00:00:00 of the day `daysAgo` days before the reference. */
export function startOfDaysAgo(daysAgo: number, reference: Date = new Date()): Date {
  const date = new Date(reference);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/** Formats a date as YYYY-MM-DD (local). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
