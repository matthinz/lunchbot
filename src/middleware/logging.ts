import { NextFunction, Request, Response } from "express";

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(
    "%s %s %s %s",
    req.method,
    req.path,
    req.header("user-agent"),
    req.ip,
  );
  next();
}
