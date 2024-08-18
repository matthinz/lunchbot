import { Request, Response } from "express";
import { z } from "zod";
import { calendarDateFrom, formatCalendarDate } from "../calendar-dates";
import { getMenuForClosestSchoolDay } from "../menu";
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

    const menu = await getMenuForClosestSchoolDay(date, fetcher);

    if (!menu) {
      res.status(404).end();
      return;
    }

    res
      .json({
        ...menu,
        date: formatCalendarDate(menu.date),
      })
      .end();
  };
}
