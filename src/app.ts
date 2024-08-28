import express, { Request, Response } from "express";
import path from "node:path";
import { createFileSystemCacheMiddleware, createHttpGetter } from "./http";
import { districtMenuMiddleware } from "./middleware/district-menu";
import { createMySchoolMenusFetcher } from "./my-school-menus";
import { menuRoute } from "./routes/menu";
import { menuRssRoute } from "./routes/rss";
import { AppOptions } from "./types";

export function createApp(options: AppOptions): { start: () => Promise<void> } {
  const app = express();

  app.use(express.static(path.join(__dirname, "../public")));

  app.use(
    "/menus/:district/:menu",
    districtMenuMiddleware({
      ...options,
      createFetcher(districtID, menuID) {
        return createMySchoolMenusFetcher({
          districtID,
          menuID,
          httpGetter: createHttpGetter({
            middleware: [
              createFileSystemCacheMiddleware({
                cacheDirectory: options.cacheDirectory,
                ttlMS: options.cacheTTLInMS,
              }),
            ],
          }),
        });
      },
    }),
  );

  app.get("/menus/:district/:menu", asyncRouteHandler(menuRoute(options)));

  app.get(
    "/menu/:district/:menu/rss",
    asyncRouteHandler(menuRssRoute(options)),
  );

  const start = () =>
    new Promise<void>((resolve, reject) => {
      app.listen(options.port, () => {
        resolve();
      });
    });

  return { start };
}

function asyncRouteHandler(
  func: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response) => void {
  return (req, res) => {
    func(req, res).catch((err) => {
      console.error(err);
      res.status(500).end();
    });
  };
}
