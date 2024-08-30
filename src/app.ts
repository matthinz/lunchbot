import express, { Request, Response, urlencoded } from "express";
import path from "node:path";
import { createFileSystemCacheMiddleware, createHttpGetter } from "./http";
import { districtMenuMiddleware } from "./middleware/district-menu";
import { createMySchoolMenusFetcher } from "./my-school-menus";
import { menuRoute } from "./routes/menu";
import { menuRssRoute } from "./routes/rss";
import { slashCommandRoute } from "./routes/slash-command";
import { AppOptions } from "./types";

export function createApp(options: AppOptions): { start: () => Promise<void> } {
  const app = express();

  app.use(express.static(path.join(__dirname, "../public")));

  app.use(morgan("combined"));

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
    "/menus/:district/:menu/rss",
    asyncRouteHandler(menuRssRoute(options)),
  );

  app.use(
    "/slack/lunch",
    urlencoded({
      extended: false,
    }),
  );
  app.post(
    "/slack/lunch",
    asyncRouteHandler(
      slashCommandRoute({
        ...options,
        createFetcher(districtSlug, menuSlug) {
          const districtID = options.districtMenuConfig[districtSlug].id;
          const menuID =
            options.districtMenuConfig[districtSlug].menus[menuSlug];
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
    ),
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
function morgan(arg0: string): any {
  throw new Error("Function not implemented.");
}
