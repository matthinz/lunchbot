import { differenceInMilliseconds } from "date-fns";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
type SimplifiedHeaders = { [key: string]: string };

export type HttpGetter = (
  url: URL,
  headers?: SimplifiedHeaders,
) => Promise<string>;

export type HttpGetterMiddleware = (
  url: URL,
  headers: SimplifiedHeaders,
  next: (url: URL, headers: SimplifiedHeaders) => Promise<string>,
) => Promise<string>;

export type CreateHttpGetterOptions = {
  middleware?: HttpGetterMiddleware[];
};

export function createHttpGetter({
  middleware,
}: CreateHttpGetterOptions = {}): HttpGetter {
  return (url: URL, headers?: { [key: string]: string }): Promise<string> => {
    const middlewareToUse = [...(middleware ?? []), fetchMiddleware];
    const next = (url: URL, headers: SimplifiedHeaders) => {
      const m = middlewareToUse.shift();
      if (m == null) {
        throw new Error("Out of middleware");
      }

      return m(url, headers, next);
    };
    return next(url, headers ?? {});
  };

  async function fetchMiddleware(
    url: URL,
    headers: SimplifiedHeaders,
    _next: HttpGetterMiddleware,
  ): Promise<string> {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      throw new Error(`HTTP request failed: ${res.status}`);
    }

    return await res.text();
  }
}

type FileSystemCacheOptions = {
  cacheDirectory: string;
  ttlMS: number;
};

export function createFileSystemCacheMiddleware({
  cacheDirectory,
  ttlMS,
}: FileSystemCacheOptions): HttpGetterMiddleware {
  return async (url, headers, next) => {
    const key = md5(url.toString());
    const cacheFile = path.resolve(cacheDirectory, key + ".txt");

    try {
      const stats = await fs.stat(cacheFile);
      const msSinceUpdate = differenceInMilliseconds(new Date(), stats.mtime);

      if (msSinceUpdate < ttlMS) {
        return await fs.readFile(cacheFile, "utf-8");
      }
    } catch {}

    const data = await next(url, headers);

    await fs.mkdir(path.dirname(cacheFile), { recursive: true });

    await fs.writeFile(cacheFile, data);

    return data;
  };
}

function md5(input: string): string {
  const hash = crypto.createHash("md5");
  hash.update(input);
  return hash.digest().toString("hex");
}
