import { z } from "zod";
import {
  firstDayOfMonth,
  formatCalendarDate,
  parseCalendarDate,
} from "./calendar-dates";
import { HttpGetter } from "./http";
import {
  Menu,
  MenuCategory,
  MenuFetcher,
  MenuItem,
  MenuRecipeItem,
} from "./types";

const TEXT_TO_IGNORE = ["Choice of", "Or"];

type CreateMySchoolMenusFetcherOptions = {
  httpGetter: HttpGetter;
  districtID: number;
  menuID: number;
};

const CalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{1,2}-\d{1,2}$/)
  .transform(parseCalendarDate);

const DisplayItemSchema = z.object({
  item: z.union([z.string(), z.number().int()]),
  name: z.string(),
  type: z.string(),
  weight: z.number().int(),
});

const DaySettingSchema = z.object({
  current_display: z.array(DisplayItemSchema),
  available_recipes: z.array(z.union([z.number().int(), z.string()])),
  hidden_items: z.array(z.unknown()),
  days_off: z
    .union([
      z.object({
        status: z.number().int(),
        description: z.string(),
      }),
      z.array(z.unknown()).length(0),
    ])
    .transform((d) => (Array.isArray(d) ? undefined : d))
    .optional(),
});

const CalendarDaySchema = z.object({
  id: z.number().int().optional(),
  day: CalendarDateSchema,
  menu_month_id: z.number().int().optional(),
  setting: z
    .string()
    .transform((s) => JSON.parse(s))
    .pipe(DaySettingSchema)
    .optional(),
  setting_original: z
    .string()
    .transform((s) => JSON.parse(s))
    .pipe(DaySettingSchema)
    .optional(),
  overwritten: z.boolean().optional(),
});

export const ResponseSchema = z.object({
  data: z.object({
    menu_month: z.coerce.date(),
    menu_month_calendar: z
      .array(CalendarDaySchema.nullable())
      .transform(
        (ar) => ar.filter(Boolean) as z.infer<typeof CalendarDaySchema>[],
      ),
  }),
});

export function createMySchoolMenusFetcher({
  httpGetter,
  menuID,
  districtID,
}: CreateMySchoolMenusFetcherOptions): MenuFetcher {
  return async (month) => {
    const rawJSON = await httpGetter(
      new URL(
        `https://myschoolmenus.com/api/public/menus/${menuID}?menu_month=${formatCalendarDate(firstDayOfMonth(month))}`,
      ),
      {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "x-district": String(districtID),
      },
    );

    return parseMySchoolMenusJSON(JSON.parse(rawJSON));
  };
}

export function parseMySchoolMenusJSON(json: any): Menu[] {
  const parsed = ResponseSchema.parse(json);

  const menus = parsed.data.menu_month_calendar
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

            if (!TEXT_TO_IGNORE.includes(i.name)) {
              currentCategory.items.push({
                text: i.name,
              });
            }

            break;

          case "recipe":
            if (!currentCategory) {
              throw Error(
                `recipe item ${JSON.stringify(i.name)} without category`,
              );
            }

            if (!augmentExistingItem(i, currentCategory.items)) {
              currentCategory.items.push({
                name: i.name,
                interestingness: 0,
              });
            }
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
    .filter(Boolean) as Menu[];

  // Now we want to score each menu item on "interestingness". This will just
  // be (1 - % of days that have this item)

  const menuItemCounts: { [key: string]: number } = {};

  forEachMenuItem(menus, (item, category) => {
    const key = [category.name, item.name].join("|");
    menuItemCounts[key] = menuItemCounts[key] ?? 0;
    menuItemCounts[key] += 1;
  });

  const countOfDaysWithMenus = menus.filter(
    (d) => d.categories.length > 0,
  ).length;

  if (countOfDaysWithMenus > 0) {
    forEachMenuItem(menus, (item, category) => {
      const key = [category.name, item.name].join("|");

      item.interestingness =
        1 - menuItemCounts[key] / (countOfDaysWithMenus * 1.0);
    });
  }

  return menus;

  function forEachMenuItem(
    menus: Menu[],
    callback: (item: MenuRecipeItem, category: MenuCategory) => void,
  ) {
    menus.forEach((menu) => {
      menu.categories.forEach((category) => {
        category.items.forEach((item) => {
          if ("name" in item) {
            callback(item, category);
          }
        });
      });
    });
  }
}

function augmentExistingItem(
  rawItem: {
    type: string;
    item: string | number;
    name: string;
    weight: number;
  },
  otherItems: MenuItem[],
): boolean {
  const SERVED_WITH = /Served with (.+)/;

  const parts = rawItem.name.split("-").map((token) => token.trim());
  const matches = parts
    .map((p) => SERVED_WITH.exec(p))
    .filter(Boolean) as RegExpExecArray[];

  if (matches.length !== 1) {
    return false;
  }

  const m = matches[0];

  const otherItemName = m[1];

  const otherItem = otherItems.find(
    (i) => "name" in i && i.name.includes(otherItemName),
  );

  if (!otherItem || !("name" in otherItem)) {
    return false;
  }

  otherItem.name = `${otherItemName} (${rawItem.name})`;
  return true;
}
