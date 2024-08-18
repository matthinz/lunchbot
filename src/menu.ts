import { formatCalendarMonth } from "./calendar-dates";
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
