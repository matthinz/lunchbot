import { Request, Response } from "express";
import { z } from "zod";
import {
  calendarDateFrom,
  formatCalendarDate,
  isSameCalendarDate,
} from "../calendar-dates";
import { CalendarDateSchema, MenuFetcher } from "../types";
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

    const menu = await fetcher(date);

    const day = menu.find((d) => isSameCalendarDate(d.date, date));
    if (day) {
      res
        .json({
          ...day,
          date: formatCalendarDate(day.date),
        })
        .end();
      return;
    }

    res
      .json({
        date: formatCalendarDate(date),
      })
      .end();
  };
}
