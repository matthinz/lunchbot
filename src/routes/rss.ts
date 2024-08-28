import { addDays } from "date-fns";
import { Request, Response } from "express";
import { Feed } from "feed";
import { Node, renderMarkdown, TAGS } from "h";
import { calendarDateToDate, formatCalendarDate } from "../calendar-dates";
import { getMenusForDates } from "../menu";
import { districtAndMenuForRequest } from "../middleware/district-menu";
import { getWeekDays, WeekDay } from "../time-thinker";
import { MenuCategory, MenuRecipeItem } from "../types";

type MenuRssRouteOptions = {
  timezone: string;
  url: URL;
};

export function menuRssRoute({
  timezone,
  url,
}: MenuRssRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const { fetcher, menuID, districtID } = districtAndMenuForRequest(req);

    const days = getWeekDays({
      referenceDate: new Date(),
      timezone,
    });

    const menus = await getMenusForDates({
      dates: days.map((d) => d.date),
      fetcher,
    });

    res
      .contentType("text/xml")
      .send(
        renderRss({
          menuID,
          districtID,
          timezone,
          url,
          days: days.map((d, i) => ({
            menu: [],
            ...d,
            ...(menus[i] ?? {}),
          })),
        }),
      )
      .end();
  };
}

type MenuCalendarDayEx = WeekDay & {
  menu: MenuCategory[];
  note?: string;
};

type RenderRssOptions = {
  days: MenuCalendarDayEx[];
  districtID: number;
  menuID: number;
  timezone: string;
  url: URL;
};

function renderRss({
  days,
  url,
  timezone,
  menuID,
  districtID,
}: RenderRssOptions): string {
  const firstDay = days[0].date;
  const niceFirstDay = formatCalendarDate(firstDay);
  const title = `Menu for the week of ${niceFirstDay}`;
  const link = new URL(`/menu?date=${niceFirstDay}`, url).toString();

  // Go to 10 AM the day before the first day
  const date = addDays(
    calendarDateToDate(firstDay, {
      hour: 10,
      minute: 0,
      seconds: 0,
      timezone: timezone,
    }),
    -1,
  );

  const feed = new Feed({
    id: "menu",
    title: "Menu",
    description: "School lunch menus",
    link: url.toString(),
    copyright: "",
  });

  feed.addItem({
    date,
    link,
    title,
    description: `School lunch menu for the week of ${niceFirstDay}`,
    id: `menu-${districtID}-${menuID}-${niceFirstDay}`,
    content: renderMarkdown(buildContent(days)),
  });

  return feed.rss2();
}

function buildContent(days: MenuCalendarDayEx[]): Node {
  const { ul, li } = TAGS;

  return ul(days.map(liForDay));

  function liForDay(day: MenuCalendarDayEx): Node {
    if (day.menu.length === 0) {
      if (day.note == null) {
        return;
      } else {
        return li(`${formatCalendarDate(day.date)}: ${day.note}`);
      }
    }
    const prefix =
      day.note == null
        ? `${formatCalendarDate(day.date)}`
        : `${formatCalendarDate(day.date)} (${day.note})`;

    const items = interestingItems(day.menu);

    console.log(items);

    if (items.length === 0) {
      if (day.note == null) {
        return;
      } else {
        return li(prefix);
      }
    } else if (items.length === 1) {
      return li(`${prefix}: ${items[0][1].name}`);
    } else {
      return li([
        `${prefix}:`,
        ul(
          day.menu.map((category) =>
            li([
              category.name,
              ul(
                category.items.map((item) =>
                  li("name" in item ? item.name : item.text),
                ),
              ),
            ]),
          ),
        ),
      ]);
    }
  }
}

function interestingItems(
  categories: MenuCategory[],
  threshold = 0.75,
): [MenuCategory, MenuRecipeItem][] {
  return categories.reduce<[MenuCategory, MenuRecipeItem][]>(
    (result, category) => {
      category.items
        .filter((item) => "name" in item && item.interestingness >= threshold)
        .forEach((item) => {
          result.push([category, item as MenuRecipeItem]);
        });

      return result;
    },
    [],
  );
}
