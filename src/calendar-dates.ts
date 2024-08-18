import { CalendarDate, CalendarMonth } from "./types";

export function isSameCalendarDate(a: CalendarDate, b: CalendarDate) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function calendarDateFrom(date: Date): CalendarDate {
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
