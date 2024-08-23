import { Request, Response } from "express";
import { DocType, render, TAGS } from "h";
import { formatCalendarDate } from "../calendar-dates";
import { getMenusForDates } from "../menu";
import { getWeekDays, WeekDay } from "../time-thinker";
import { MenuCategory, MenuFetcher } from "../types";

type MenuRouteOptions = {
  fetcher: MenuFetcher;
  timezone: string;
};

type WeekDayWithMenu = WeekDay & {
  menu: MenuCategory[] | undefined;
  note: string | undefined;
};

export function menuRoute({
  fetcher,
  timezone,
}: MenuRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const rawDate = (req.query ?? {}).date;
    let referenceDate: Date;

    if (!rawDate) {
      referenceDate = new Date();
    } else if (typeof rawDate !== "string") {
      res.status(400).end();
      return;
    } else {
      referenceDate = new Date(rawDate);
      if (isNaN(referenceDate as unknown as number)) {
        res.status(400).end();
        return;
      }
    }

    const weekdays = getWeekDays({
      referenceDate,
      timezone,
    });

    res.header("cache-control", "no-cache");

    const menus = await getMenusForDates({
      dates: weekdays.map(({ date }) => date),
      fetcher,
    });

    const days = weekdays.map((weekday, i) => ({
      ...weekday,
      menu: menus[i]?.menu,
      note: menus[i]?.note,
    }));

    res
      .status(200)
      .contentType("text/html")
      .send(render(view(days)));
  };
}

function view(days: WeekDayWithMenu[]) {
  const { html, head, h2, meta, link, body, article, p, ul, li } = TAGS;

  return [
    DocType.HTML,
    html([
      head([
        meta({ charset: "utf-8" }),
        meta({
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        }),
        link({
          type: "text/css",
          rel: "stylesheet",
          href: "/style.css",
        }),
      ]),
      body(
        days.map((day) =>
          article([
            h2(formatCalendarDate(day.date)),
            day.note && p(day.note),
            day.menu &&
              ul(
                day.menu.map((i) =>
                  li([
                    i.name,
                    ul(
                      i.items.map((item) =>
                        li("name" in item ? item.name : item.text),
                      ),
                    ),
                  ]),
                ),
              ),
          ]),
        ),
      ),
    ]),
  ];
}
