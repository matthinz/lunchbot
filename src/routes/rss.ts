import { addDays } from "date-fns";
import { Request, Response } from "express";
import { Feed } from "feed";
import { Node, renderMarkdown, TAGS } from "h";
import { calendarDateToDate, formatCalendarDate } from "../calendar-dates";
import { getMenusForDates, interestingItems } from "../menu";
import { districtAndMenuForRequest } from "../middleware/district-menu";
import { getWeekDays, WeekDay } from "../time-thinker";
import { Menu } from "../types";

type MenuRssRouteOptions = {
  rssFeedVersion?: number;
  timezone: string;
  url: URL;
};

export function menuRssRoute({
  rssFeedVersion,
  timezone,
  url,
}: MenuRssRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const { fetcher, menuSlug, districtSlug } = districtAndMenuForRequest(req);

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
          menuSlug,
          districtSlug,
          rssFeedVersion,
          timezone,
          url,
          menus: menus.map((menu, i) => ({
            categories: [],
            ...days[i],
            ...(menu ?? {}),
          })),
        }),
      )
      .end();
  };
}

type DailyMenu = WeekDay & Menu;

type RenderRssOptions = {
  menus: DailyMenu[];
  districtSlug: string;
  menuSlug: string;
  rssFeedVersion?: number;
  timezone: string;
  url: URL;
};

function renderRss({
  menus,
  url,
  rssFeedVersion,
  timezone,
  menuSlug,
  districtSlug,
}: RenderRssOptions): string {
  const firstDay = menus[0].date;
  const niceFirstDay = formatCalendarDate(firstDay);
  const title = `Menu for the week of ${niceFirstDay}`;
  const link = new URL(
    `/menus/${encodeURIComponent(districtSlug)}/${encodeURIComponent(menuSlug)}?date=${niceFirstDay}${rssFeedVersion == null ? "" : `&v=${encodeURIComponent(rssFeedVersion)}`}`,
    url,
  ).toString();

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
    id: `menu-${districtSlug}-${menuSlug}-${niceFirstDay}`,
    content: renderMarkdown(buildContent(menus)),
  });

  return feed.rss2();
}

function buildContent(menus: DailyMenu[]): Node {
  const { ul, li } = TAGS;

  return ul(menus.map(liForDay));

  function liForDay(menu: DailyMenu): Node {
    if (menu.categories.length === 0) {
      if (menu.note == null) {
        return;
      } else {
        return li(`${formatCalendarDate(menu.date)}: ${menu.note}`);
      }
    }

    const prefix =
      menu.note == null
        ? `${formatCalendarDate(menu.date)}`
        : `${formatCalendarDate(menu.date)} (${menu.note})`;

    if (menu.categories.length === 0) {
      if (menu.note == null) {
        return;
      } else {
        return li(prefix);
      }
    }

    const items = interestingItems(menu.categories);

    if (items.length === 1) {
      return li(`${prefix}: ${items[0][1].name}`);
    } else {
      return li([
        `${prefix}:`,
        ul(
          menu.categories.map((category) =>
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
