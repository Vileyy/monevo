export interface CalendarCell {
  day: number;
  date: Date;
  isAdjacent: boolean;
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Sunday-first calendar matrix. Empty leading/trailing slots are filled with
 * adjacent-month days so every row has 7 cells.
 */
export function buildCalendarWeeks(
  year: number,
  month: number,
): CalendarCell[][] {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    const day = daysInPrevMonth - firstDayOfWeek + 1 + i;
    cells.push({ day, isAdjacent: true, date: new Date(year, month - 1, day) });
  }

  for (let day = 1; day <= daysInCurrentMonth; day++) {
    cells.push({ day, isAdjacent: false, date: new Date(year, month, day) });
  }

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    cells.push({ day, isAdjacent: true, date: new Date(year, month + 1, day) });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function formatRangeLabel(start: Date | null, end: Date | null): string {
  if (!start) return "--";

  const effectiveEnd = end ?? start;
  const sameDay =
    start.getFullYear() === effectiveEnd.getFullYear() &&
    start.getMonth() === effectiveEnd.getMonth() &&
    start.getDate() === effectiveEnd.getDate();

  if (sameDay) {
    return `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  }

  if (
    start.getFullYear() === effectiveEnd.getFullYear() &&
    start.getMonth() === effectiveEnd.getMonth()
  ) {
    return `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()} – ${effectiveEnd.getDate()}, ${start.getFullYear()}`;
  }

  if (start.getFullYear() === effectiveEnd.getFullYear()) {
    return `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()} – ${SHORT_MONTHS[effectiveEnd.getMonth()]} ${effectiveEnd.getDate()}, ${start.getFullYear()}`;
  }

  return `${SHORT_MONTHS[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${SHORT_MONTHS[effectiveEnd.getMonth()]} ${effectiveEnd.getDate()}, ${effectiveEnd.getFullYear()}`;
}
