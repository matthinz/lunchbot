import { format as formatDate, isSameDay, parse as parseDate } from "date-fns";
import { Request, Response } from "express";
import { z } from "zod";
import { fileSystemCache } from "../fs-cache";
import { loadMenu } from "../menu";
import { AppOptions } from "../types";
type MenuRouteOptions = Pick<
  AppOptions,
  "menuID" | "districtID" | "cacheTTLInMS" | "cacheDirectory"
>;

const QuerySchema = z.object({
  date: z
    .string()
    .default(() => formatDate(new Date(), "yyyy-MM-dd"))
    .transform((s) => parseDate(s, "yyyy-MM-dd", new Date())),
});

export function menuRoute({
  menuID,
  districtID,
  cacheDirectory,
  cacheTTLInMS,
}: MenuRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const query = QuerySchema.parse(req.query ?? {});

    console.error(query);

    const date = query.date ?? new Date();

    const menu = await loadMenu({
      districtID,
      menuID,
      middleware: [
        fileSystemCache({
          cacheDirectory,
          ttlMS: cacheTTLInMS,
        }),
      ],
    });

    const day = menu.find((d) => isSameDay(d.date, date));
    if (day) {
      res
        .json({
          ...day,
          date: formatDate(day.date, "yyyy-MM-dd"),
        })
        .end();
      return;
    }

    res
      .json({
        date: formatDate(date, "yyyy-MM-dd"),
      })
      .end();
  };
}
