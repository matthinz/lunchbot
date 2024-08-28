import { formatCalendarMonth, isSameCalendarDate } from "./calendar-dates";
import { CalendarDate, Menu, MenuFetcher } from "./types";

type GetMenusForDatesOptions = {
  dates: CalendarDate[];
  fetcher: MenuFetcher;
};

type PromiseOfArrayOfOptionalDays = Promise<(Menu | undefined)[]>;

export async function getMenusForDates({
  dates,
  fetcher,
}: GetMenusForDatesOptions): PromiseOfArrayOfOptionalDays {
  const menusByMonth: { [key: string]: Menu[] } = {};

  return dates.reduce<PromiseOfArrayOfOptionalDays>(
    (promise, date) =>
      promise.then(async (result) => {
        const key = formatCalendarMonth(date);

        let day = menusByMonth[key]?.find((d) =>
          isSameCalendarDate(d.date, date),
        );

        if (!day) {
          // Need to do a fetch
          menusByMonth[key] = await fetcher(date);
          day = menusByMonth[key]?.find((d) =>
            isSameCalendarDate(d.date, date),
          );
        }

        result.push(day);

        return result;
      }),
    Promise.resolve([]),
  );
}
