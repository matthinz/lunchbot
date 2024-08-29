import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { DistrictMenuConfig, MenuFetcher } from "../types";

type DistrictMenuMiddlewareOptions = {
  districtMenuConfig: DistrictMenuConfig;
  createFetcher: (districtID: number, menuID: number) => MenuFetcher;
};

const paramsSchema = z.object({
  menu: z.string(),
  district: z.string(),
});

export function districtMenuMiddleware({
  createFetcher,
  districtMenuConfig,
}: DistrictMenuMiddlewareOptions): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (req, res, next) => {
    const parsed = paramsSchema.safeParse(req.params);

    console.error(parsed);
    console.error(districtMenuConfig);

    if (!parsed.success) {
      res.status(404).end();
      return;
    }

    const districtSlug = parsed.data.district;
    const menuSlug = parsed.data.menu;

    const district = districtMenuConfig[districtSlug];
    console.error(district);
    if (!district) {
      res.status(404).end();
    }

    const menuID = district.menus[menuSlug];
    if (!menuID) {
      res.status(404).end();
    }

    Object.assign(req, {
      districtID: district.id,
      districtSlug,
      menuID,
      menuSlug,
      fetcher: createFetcher(district.id, menuID),
    });

    next();
  };
}

export function districtAndMenuForRequest(req: Request): {
  districtID: number;
  districtSlug: string;
  menuID: number;
  menuSlug: string;
  fetcher: MenuFetcher;
} {
  return req as unknown as ReturnType<typeof districtAndMenuForRequest>;
}
