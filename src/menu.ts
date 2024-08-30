import { formatCalendarMonth, isSameCalendarDate } from "./calendar-dates";
import {
  CalendarDate,
  Menu,
  MenuCategory,
  MenuFetcher,
  MenuRecipeItem,
} from "./types";

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

export function interestingItems(
  categories: MenuCategory[],
  threshold = 0.75,
): [MenuCategory, MenuRecipeItem][] {
  return categories.reduce<[MenuCategory, MenuRecipeItem][]>(
    (result, category) => {
      category.items.forEach((item) => {
        if ("name" in item && item.interestingness >= threshold) {
          result.push([category, item]);
        }
      });
      return result;
    },
    [],
  );
}
