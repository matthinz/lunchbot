import { z } from "zod";
import { parseCalendarDate } from "./calendar-dates";

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
    LUNCH_BOT_SLACK_VERIFICATION_TOKEN: z.string().optional(),
    LUNCH_BOT_TIMEZONE: z.string(),
    PORT: z.coerce.number().int().default(DEFAULT_PORT),
  })
  .transform(
    ({
      LUNCH_BOT_CACHE_TTL_IN_MS: cacheTTLInMS,
      LUNCH_BOT_CACHE_DIR: cacheDirectory,
      LUNCH_BOT_DISTRICT_ID: districtID,
      LUNCH_BOT_MENU_ID: menuID,
      LUNCH_BOT_SLACK_VERIFICATION_TOKEN: slackVerificationToken,
      LUNCH_BOT_TIMEZONE: timezone,
      PORT: port,
    }) => ({
      cacheTTLInMS,
      cacheDirectory,
      districtID,
      menuID,
      port,
      slackVerificationToken,
      timezone,
    }),
  );

export type AppOptions = z.infer<typeof AppOptionsSchema>;

export const CalendarDateSchema = z.string().transform(parseCalendarDate);

export type CalendarDate = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
};

export type CalendarMonth = {
  readonly year: number;
  readonly month: number;
};

export type MenuCalendarDay = {
  date: CalendarDate;
  note?: string;
  menu?: MenuCategory[];
};

export type MenuRecipeItem = {
  name: string;
  interestingness: number;
};

export type MenuTextItem = {
  text: string;
};

export type MenuItem = MenuRecipeItem | MenuTextItem;

export type MenuCategory = {
  name: string;
  items: MenuItem[];
};

export type MenuFetcher = (month: CalendarMonth) => Promise<MenuCalendarDay[]>;
