import {
  addDays,
  formatCalendarMonth,
  isSameCalendarDate,
} from "./calendar-dates";
import { CalendarDate, MenuCalendarDay, MenuFetcher } from "./types";

type GetMenuForNextSchoolDayOptions = {
  referenceDate: CalendarDate;
  fetcher: MenuFetcher;
  check?: (d: MenuCalendarDay) => boolean;
};

export async function getMenuForNextSchoolDay({
  referenceDate,
  fetcher,
  check,
}: GetMenuForNextSchoolDayOptions): Promise<MenuCalendarDay | undefined> {
  const daysByMonth: { [key: string]: MenuCalendarDay[] } = {};

  const MAX_FETCHES = 2;
  let fetchCount = 0;

  while (true) {
    let days = daysByMonth[formatCalendarMonth(referenceDate)];
    if (!days) {
      if (fetchCount >= MAX_FETCHES) {
        return;
      }
      fetchCount += 1;
      days = daysByMonth[formatCalendarMonth(referenceDate)] =
        await fetcher(referenceDate);
    }

    const day = days.find(
      (d) =>
        isSameCalendarDate(d.date, referenceDate) &&
        (check == null || check(d)),
    );
    if (day) {
      return day;
    }
    referenceDate = addDays(referenceDate, 1);
  }
}
