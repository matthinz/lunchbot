import { parseResponse } from "./parse";
import { MenuCalendarDay, MenuCategory } from "./types";

export type LoadMenuMiddleware = (
  options: LoadMenuOptions,
  next: () => Promise<string>,
) => Promise<string>;

export type LoadMenuOptions = {
  readonly middleware: LoadMenuMiddleware[];
  readonly districtID: number;
  readonly menuID: number;
};

export async function loadMenu(
  options: LoadMenuOptions,
): Promise<MenuCalendarDay[]> {
  const workingMiddleware = [...options.middleware, fetchMenuJSON];

  const next = (): Promise<string> => {
    const nextMiddleware = workingMiddleware.shift();
    if (nextMiddleware) {
      return nextMiddleware(options, next);
    }
    throw new Error("Out of middleware.");
  };

  const firstMiddleware = workingMiddleware.shift();

  if (firstMiddleware == null) {
    throw new Error("No first middleware.");
  }

  const json = await firstMiddleware(options, next);

  const parsed = parseResponse(JSON.parse(json));

  return parsed.data.menu_month_calendar
    .map((d) => {
      if (d == null) {
        return;
      }

      if (d.setting == null) {
        return;
      }

      const date = d.day;

      const categories: MenuCategory[] = [];
      let currentCategory: MenuCategory | undefined;

      let note: string | undefined;

      if (d.setting.days_off?.status) {
        note = d.setting.days_off?.description;
      }

      d.setting.current_display.forEach((i) => {
        switch (i.type) {
          case "category":
            currentCategory = {
              name: i.name,
              items: [],
            };
            categories.push(currentCategory);
            break;

          case "text":
            if (!currentCategory) {
              throw Error(
                `text item ${JSON.stringify(i.name)} without category`,
              );
            }
            currentCategory.items.push({
              text: i.name,
            });
            break;

          case "recipe":
            if (!currentCategory) {
              throw Error(
                `recipe item ${JSON.stringify(i.name)} without category`,
              );
            }
            currentCategory.items.push({
              name: i.name,
            });
            break;

          default:
            throw new Error(`Unknown item type: ${JSON.stringify(i.type)}`);
        }
      });

      return {
        date,
        note,
        categories,
      };
    })
    .filter(Boolean) as MenuCalendarDay[];
}

async function fetchMenuJSON(
  { districtID, menuID }: LoadMenuOptions,
  _next: LoadMenuMiddleware,
): Promise<string> {
  const res = await fetch(
    `https://myschoolmenus.com/api/public/menus/${menuID}`,
    {
      credentials: "include",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "x-district": String(districtID),
      },
      method: "GET",
    },
  );

  if (!res.ok) {
    throw new Error(`HTTP request failed: ${res.status}`);
  }

  return await res.text();
}
