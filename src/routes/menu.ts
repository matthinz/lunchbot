import { Request, Response } from "express";
import { DocType, h, render } from "h";
import { z } from "zod";
import {
  calendarDateFrom,
  formatCalendarDate,
  isSameCalendarDate,
} from "../calendar-dates";
import { getMenuForNextSchoolDay } from "../menu";
import { CalendarDateSchema, MenuCalendarDay, MenuFetcher } from "../types";

type MenuRouteOptions = {
  fetcher: MenuFetcher;
};

const QuerySchema = z.object({
  date: CalendarDateSchema.optional(),
});

export function menuRoute({
  fetcher,
}: MenuRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const query = QuerySchema.parse(req.query ?? {});

    console.error(query);

    const date = query.date ?? calendarDateFrom(new Date());

    const menu = await getMenuForNextSchoolDay({
      referenceDate: date,
      fetcher,
      check(day) {
        return !!day.menu && day.menu?.length > 0;
      },
    });

    res.header("cache-control", "no-cache");

    if (!menu) {
      res.status(404).end();
      return;
    }

    if (!isSameCalendarDate(menu.date, date)) {
      res.redirect(`/menu?date=${formatCalendarDate(menu.date)}`);
      return;
    }

    res
      .status(200)
      .contentType("text/html")
      .send(render(view(menu)));
  };
}

function view(menu: MenuCalendarDay) {
  return [
    DocType.HTML,
    h("html", [
      h("head", [
        h("meta", { charset: "utf-8" }),
        h(
          "meta",
          {
            name: "viewport",
            content: "width=device-width, initial-scale=1",
          },
          [],
        ),
        h("link", {
          type: "text/css",
          rel: "stylesheet",
          href: "/style.css",
        }),
      ]),
      h("body", [
        h("h1", formatCalendarDate(menu.date)),
        menu.note && h("p", menu.note),
        menu.menu &&
          h(
            "ul",
            menu?.menu.map((i) =>
              h("li", [
                i.name,
                h(
                  "ul",
                  i.items.map((item) =>
                    h("li", "name" in item ? item.name : item.text),
                  ),
                ),
              ]),
            ),
          ),
      ]),
    ]),
  ];
}
