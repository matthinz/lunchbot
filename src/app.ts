import express, { Request, Response } from "express";
import { menuRoute } from "./routes/menu";
import { AppOptions } from "./types";

export function createApp(options: AppOptions): { start: () => Promise<void> } {
  const app = express();

  app.get("/menu", asyncRouteHandler(menuRoute(options)));

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
