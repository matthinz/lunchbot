import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { compareCalendarDates, parseCalendarDate } from "./calendar-dates";
import { CalendarDate } from "./types";

export type WeekDay = {
  readonly date: CalendarDate;
  readonly disposition: "past" | "present" | "future";
};

type GetWeekDaysOptions = {
  /**
   * The offset, in seconds from midnight, that marks the transition from
   * a "current" day.
   */
  currentDayTransitionTime?: number;
  referenceDate: Date;
  timezone: string;
};

/**
 * Given a reference date, returns an array representing the weekdays for
 * the reference date's week. If reference date falls on a weekend, returns
 * the _next_ set of weekdays.
 * @param referenceDate
 */
export function getWeekDays({
  currentDayTransitionTime = 12 * 60,
  referenceDate,
  timezone,
}: GetWeekDaysOptions): WeekDay[] {
  const minutesIntoReferenceDateInTimezone =
    parseInt(formatInTimeZone(referenceDate, timezone, "H"), 10) * 60 +
    parseInt(formatInTimeZone(referenceDate, timezone, "m"), 10);

  if (minutesIntoReferenceDateInTimezone >= currentDayTransitionTime) {
    // we are actually considering the next day for reference purposes
    referenceDate = addDays(referenceDate, 1);
  }

  let firstDay = firstDayOfWeek(referenceDate, timezone);
  const result: WeekDay[] = [];

  const referenceDateInTimezone = parseCalendarDate(
    formatInTimeZone(referenceDate, timezone, "yyyy-MM-dd"),
  );

  for (let i = 0; i < 5; i++) {
    const date = addDays(firstDay, i);
    const dateAsStringInTZ = formatInTimeZone(date, timezone, "yyyy-MM-dd");
    const dateInTimezone = parseCalendarDate(dateAsStringInTZ);

    let disposition: WeekDay["disposition"] = "past";

    if (compareCalendarDates(dateInTimezone, referenceDateInTimezone) === 0) {
      disposition = "present";
    } else if (
      compareCalendarDates(dateInTimezone, referenceDateInTimezone) > 0
    ) {
      disposition = "future";
    }

    result.push({
      date: dateInTimezone,
      disposition,
    });
  }

  return result;
}

function firstDayOfWeek(date: Date, timezone: string): Date {
  const referenceDayOfWeek = parseInt(
    formatInTimeZone(date, timezone, "e"),
    10,
  );
  if (referenceDayOfWeek === 2) {
    // It's already Monday, no changes needed
    return date;
  } else if (referenceDayOfWeek >= 3 && referenceDayOfWeek <= 6) {
    // Tuesday - Friday, move back to monday
    return addDays(date, (referenceDayOfWeek - 2) * -1);
  } else if (referenceDayOfWeek === 7) {
    // Saturday -- move to monday
    return addDays(date, 2);
  } else if (referenceDayOfWeek === 1) {
    // Sunday -- move to monday
    return addDays(date, 1);
  } else {
    throw new Error(`Unexpected referenceDayOfWeek: ${referenceDayOfWeek}`);
  }
}
