import { z } from "zod";
import { parseCalendarDate } from "./calendar-dates";
import { DistrictMenuConfigSchema } from "./schemas";

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
    LUNCH_BOT_DISTRICT_MENU_CONFIG: z
      .string()
      .transform((s) => JSON.parse(s))
      .pipe(DistrictMenuConfigSchema),
    LUNCH_BOT_SLACK_VERIFICATION_TOKEN: z.string().optional(),
    LUNCH_BOT_TIMEZONE: z.string(),
    LUNCH_BOT_URL: z
      .string()
      .url()
      .transform((url) => new URL(url))
      .optional(),
    PORT: z.coerce.number().int().default(DEFAULT_PORT),
  })
  .transform(
    ({
      LUNCH_BOT_CACHE_TTL_IN_MS: cacheTTLInMS,
      LUNCH_BOT_CACHE_DIR: cacheDirectory,
      LUNCH_BOT_DISTRICT_MENU_CONFIG: districtMenuConfig,
      LUNCH_BOT_SLACK_VERIFICATION_TOKEN: slackVerificationToken,
      LUNCH_BOT_TIMEZONE: timezone,
      LUNCH_BOT_URL: url,
      PORT: port,
    }) => ({
      cacheTTLInMS,
      cacheDirectory,
      districtMenuConfig,
      port,
      slackVerificationToken,
      timezone,
      url,
    }),
  )
  .transform((values) => ({
    ...values,
    url: values.url ?? new URL(`http://localhost:${values.port}`),
  }));

export type DistrictMenuConfig = z.infer<typeof DistrictMenuConfigSchema>;

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
