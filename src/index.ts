import { isSameDay, parse as parseDate } from "date-fns";
import { config } from "dotenv";
import { fileSystemCache } from "./fs-cache";
import { loadMenu } from "./load-menu";
import { MenuResponse } from "./parse";

const DEFAULT_CACHE_TTL_IN_MS = 60 * 60 * 1000;

config();

run().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});

async function run() {
  const districtID = process.env.DISTRICT_ID
    ? parseInt(process.env.DISTRICT_ID)
    : NaN;

  if (isNaN(districtID)) {
    throw new Error("Must set DISTRICT_ID env");
  }

  const menuID = process.env.MENU_ID ? parseInt(process.env.MENU_ID) : NaN;
  if (isNaN(menuID)) {
    throw new Error("Must set MENU_ID env");
  }

  const cacheDirectory = process.env.CACHE_DIRECTORY ?? ".cache";

  const cacheTTLMS = process.env.CACHE_TTL_IN_MILLISECONDS
    ? parseInt(process.env.CACHE_TTL_IN_MILLISECONDS, 10)
    : NaN;

  const date = process.env.DATE
    ? parseDate(process.env.DATE, "yyyy-MM-dd", new Date())
    : new Date();

  const response = await loadMenu({
    middleware: [
      fileSystemCache({
        cacheDirectory,
        ttlMS: isNaN(cacheTTLMS) ? DEFAULT_CACHE_TTL_IN_MS : cacheTTLMS,
      }),
    ],
    districtID,
    menuID,
  });

  displayMenu(response, date);
}

function displayMenu(response: MenuResponse, date: Date) {
  const day = response.data.menu_month_calendar.find((i) =>
    isSameDay(date, i.day),
  );

  console.log(date, day?.day);

  if (!day) {
    console.error("No school today");
    process.exitCode = 1;
    return;
  }

  let currentCategory: string | undefined;

  day.setting.current_display.forEach((item) => {
    if (item.type === "category") {
      console.log(item.name);
      currentCategory = item.name;
      return;
    }

    if (item.type === "text") {
      console.log("    %s", item.name);
      return;
    }

    console.log("  - %s", item.name);
  });
}
