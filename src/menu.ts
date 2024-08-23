import { formatCalendarMonth, isSameCalendarDate } from "./calendar-dates";
import { CalendarDate, MenuCalendarDay, MenuFetcher } from "./types";

type GetMenusForDatesOptions = {
  dates: CalendarDate[];
  fetcher: MenuFetcher;
};

type PromiseOfArrayOfOptionalDays = Promise<(MenuCalendarDay | undefined)[]>;

export async function getMenusForDates({
  dates,
  fetcher,
}: GetMenusForDatesOptions): PromiseOfArrayOfOptionalDays {
  const daysByMonth: { [key: string]: MenuCalendarDay[] } = {};

  return dates.reduce<PromiseOfArrayOfOptionalDays>(
    (promise, date) =>
      promise.then(async (result) => {
        const key = formatCalendarMonth(date);

        let day = daysByMonth[key]?.find((d) =>
          isSameCalendarDate(d.date, date),
        );

        if (!day) {
          // Need to do a fetch
          daysByMonth[key] = await fetcher(date);
          day = daysByMonth[key]?.find((d) => isSameCalendarDate(d.date, date));
        }

        result.push(day);

        return result;
      }),
    Promise.resolve([]),
  );
}
