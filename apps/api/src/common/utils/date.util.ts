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
