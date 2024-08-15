import { z } from "zod";

const DEFAULT_CACHE_DIRECTORY = ".cache";
const DEFAULT_PORT = 3000;
const DEFAULT_CACHE_TTL_IN_MS = 60 * 60 * 1000;

export const AppOptionsSchema = z
  .object({
    LUNCH_BOT_CACHE_TTL_IN_MS: z.coerce
      .number()
      .int()
      .default(DEFAULT_CACHE_TTL_IN_MS),
    LUNCH_BOT_CACHE_DIR: z.string().default(DEFAULT_CACHE_DIRECTORY),
    LUNCH_BOT_DISTRICT_ID: z.coerce.number().int(),
    LUNCH_BOT_MENU_ID: z.coerce.number().int(),
    PORT: z.coerce.number().int().default(DEFAULT_PORT),
  })
  .transform(
    ({
      LUNCH_BOT_CACHE_TTL_IN_MS: cacheTTLInMS,
      LUNCH_BOT_CACHE_DIR: cacheDirectory,
      LUNCH_BOT_DISTRICT_ID: districtID,
      LUNCH_BOT_MENU_ID: menuID,
      PORT: port,
    }) => ({
      cacheTTLInMS,
      cacheDirectory,
      districtID,
      menuID,
      port,
    }),
  );

export type AppOptions = z.infer<typeof AppOptionsSchema>;

export type MenuCalendarDay = {
  date: Date;
  note?: string;
  categories: MenuCategory[];
};

export type MenuRecipeItem = {
  name: string;
};

export type MenuTextItem = {
  text: string;
};

export type MenuItem = MenuRecipeItem | MenuTextItem;

export type MenuCategory = {
  name: string;
  items: MenuItem[];
};
