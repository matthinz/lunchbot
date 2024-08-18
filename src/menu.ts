import {
  addDays,
  formatCalendarMonth,
  isSameCalendarDate,
} from "./calendar-dates";
import { CalendarDate, MenuCalendarDay, MenuFetcher } from "./types";

type LoadMenuOptions = {
  dates: CalendarDate[];
  fetcher: MenuFetcher;
};

export async function loadMenu({
  dates,
  fetcher,
}: LoadMenuOptions): Promise<MenuCalendarDay[]> {
  const promisesByMonth = new Map<string, Promise<MenuCalendarDay[]>>();

  const result = new Array<MenuCalendarDay>(dates.length);

  dates.forEach((date) => {
    const key = formatCalendarMonth(date);
    if (!promisesByMonth.has(key)) {
      promisesByMonth.set(key, fetcher(date));
    }

    const promise = promisesByMonth.get(key);
    if (!promise) {
      throw new Error();
    }

    promisesByMonth.set(
      key,
      promise.then(async (menuDays) => {
        menuDays.forEach((menuDay) => {});

        return menuDays;
      }),
    );
  });

  await Promise.all(promisesByMonth.values());

  return result;
}

export async function getMenuForClosestSchoolDay(
  referenceDate: CalendarDate,
  fetcher: MenuFetcher,
): Promise<MenuCalendarDay | undefined> {
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

    const day = days.find((d) => isSameCalendarDate(d.date, referenceDate));
    if (day) {
      return day;
    }
    referenceDate = addDays(referenceDate, 1);
  }
}
