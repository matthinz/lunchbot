import express, { Request, Response } from "express";
import path from "node:path";
import { createFileSystemCacheMiddleware, createHttpGetter } from "./http";
import { createMySchoolMenusFetcher } from "./my-school-menus";
import { menuRoute } from "./routes/menu";
import { slashCommand } from "./routes/slash-command";
import { AppOptions } from "./types";

export function createApp(options: AppOptions): { start: () => Promise<void> } {
  const app = express();

  const fetcher = createMySchoolMenusFetcher({
    ...options,
    httpGetter: createHttpGetter({
      middleware: [
        createFileSystemCacheMiddleware({
          cacheDirectory: options.cacheDirectory,
          ttlMS: options.cacheTTLInMS,
        }),
      ],
    }),
  });

  app.use(express.static(path.join(__dirname, "../public")));

  app.get("/menu", asyncRouteHandler(menuRoute({ ...options, fetcher })));

  app.use(
    "/slack/lunch",
    express.urlencoded({
      extended: false,
    }),
  );
  app.post(
    "/slack/lunch",
    asyncRouteHandler(slashCommand({ ...options, fetcher })),
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
