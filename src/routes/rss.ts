import { Request, Response } from "express";
import { Feed } from "feed";
import { Node, renderMarkdown, TAGS } from "h";
import { formatCalendarDate } from "../calendar-dates";
import { getMenusForDates } from "../menu";
import { getWeekDays, WeekDay } from "../time-thinker";
import { MenuCategory, MenuFetcher, MenuRecipeItem } from "../types";

type MenuRssRouteOptions = {
  fetcher: MenuFetcher;
  timezone: string;
};

export function menuRssRoute({
  fetcher,
  timezone,
}: MenuRssRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
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
        renderRss(
          days.map((d, i) => ({
            menu: [],
            ...d,
            ...(menus[i] ?? {}),
          })),
        ),
      )
      .end();
  };
}

type MenuCalendarDayEx = WeekDay & {
  menu: MenuCategory[];
  note?: string;
};

function renderRss(days: MenuCalendarDayEx[]): string {
  const title = `Menu for the week of ${formatCalendarDate(days[0].date)}`;

  const feed = new Feed({
    id: "menu",
    title: "Menu",
    copyright: "",
  });

  feed.addItem({
    date: new Date(),
    link: "",
    title,
    description: "",
    id: `menu-${formatCalendarDate(days[0].date)}`,
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
