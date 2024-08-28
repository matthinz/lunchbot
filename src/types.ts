import { z } from "zod";
import { parseCalendarDate } from "./calendar-dates";
import { AppOptionsSchema, DistrictMenuConfigSchema } from "./schemas";

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

export type Menu = {
  date: CalendarDate;
  note?: string;
  categories: MenuCategory[];
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

export type MenuFetcher = (month: CalendarMonth) => Promise<Menu[]>;
