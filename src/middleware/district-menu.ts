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

    const district = districtMenuConfig[parsed.data.district];
    console.error(district);
    if (!district) {
      res.status(404).end();
    }

    const menuID = district.menus[parsed.data.menu];
    if (!menuID) {
      res.status(404).end();
    }

    Object.assign(req, {
      districtID: district.id,
      menuID,
      fetcher: createFetcher(district.id, menuID),
    });

    next();
  };
}

export function districtAndMenuForRequest(req: Request): {
  districtID: number;
  menuID: number;
  fetcher: MenuFetcher;
} {
  return req as unknown as ReturnType<typeof districtAndMenuForRequest>;
}
