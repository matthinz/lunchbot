import { differenceInMilliseconds } from "date-fns";
import fs from "node:fs/promises";
import path from "node:path";
import { LoadMenuMiddleware } from "./menu";

type FileSystemCacheOptions = {
  cacheDirectory: string;
  ttlMS: number;
};

export function fileSystemCache({
  cacheDirectory,
  ttlMS,
}: FileSystemCacheOptions): LoadMenuMiddleware {
  return async (options, next) => {
    const key = [options.districtID, options.menuID].join("-");
    const cacheFile = path.resolve(cacheDirectory, key + ".txt");
    try {
      const stats = await fs.stat(cacheFile);
      const msSinceUpdate = differenceInMilliseconds(new Date(), stats.mtime);

      if (msSinceUpdate < ttlMS) {
        return await fs.readFile(cacheFile, "utf-8");
      }
    } catch {}

    const json = await next();

    await fs.mkdir(path.dirname(cacheFile), { recursive: true });

    await fs.writeFile(cacheFile, json);

    return json;
  };
}
