import { addDays as _addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDate, CalendarMonth } from "./types";

const FORMAT_STRINGS = {
  year: "y",
  month: "m",
  day: "d",
} as const;

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const _date = new Date(date.year, date.month - 1, date.day);

  return calendarDateFrom(_addDays(_date, days));
}

export function calendarDateToDate(
  { year, month, day }: CalendarDate,
  timezone: string,
) {
  const date = new Date(year, month, day);
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  const FIELDS = ["year", "month", "day"] as const;

  for (const f of FIELDS) {
    if (a[f] < b[f]) {
      return -1;
    } else if (a[f] > b[f]) {
      return 1;
    }
  }

  return 0;
}

export function isSameCalendarDate(a: CalendarDate, b: CalendarDate) {
  return compareCalendarDates(a, b) === 0;
}

export function isDayBefore(
  date: CalendarDate,
  referenceDate: CalendarDate,
): boolean {
  const dayBefore = calendarDateFrom(
    new Date(
      referenceDate.year,
      referenceDate.month - 1,
      referenceDate.day - 1,
    ),
  );
  return isSameCalendarDate(date, dayBefore);
}

export function calendarDateFrom(date: Date, timezone?: string): CalendarDate {
  if (timezone) {
    const year = parseInt(formatInTimeZone(date, "y", timezone), 10);
    const month = parseInt(formatInTimeZone(date, "M", timezone), 10);
    const day = parseInt(formatInTimeZone(date, "d", timezone), 10);
    return { year, month, day };
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function calendarMonthOf(date: Date): CalendarMonth {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function firstDayOfMonth({ month, year }: CalendarMonth): CalendarDate {
  return {
    year,
    month,
    day: 1,
  };
}

export function formatCalendarDate({ year, month, day }: CalendarDate): string {
  return [zeroPad(year, 4), zeroPad(month, 2), zeroPad(day, 2)].join("-");
}

export function formatCalendarMonth({ year, month }: CalendarMonth): string {
  return [zeroPad(year, 4), zeroPad(month, 2)].join("-");
}

export function parseCalendarDate(input: string): CalendarDate {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(input);
  if (!m) {
    throw new TypeError("input is not a valid YYYY-MM-DD date");
  }
  return {
    year: parseInt(m[1], 10),
    month: parseInt(m[2], 10),
    day: parseInt(m[3], 10),
  };
}

function zeroPad(num: number, length: number) {
  let result = String(num);
  while (result.length < length) {
    result = `0${result}`;
  }
  return result;
}
