import { Request, Response } from "express";
import { z } from "zod";
import { formatCalendarDate } from "../calendar-dates";
import { getMenusForDates, interestingItems } from "../menu";
import { getWeekDays } from "../time-thinker";
import {
  AppOptions,
  CalendarDate,
  DistrictMenuConfig,
  Menu,
  MenuFetcher,
} from "../types";

type SlashCommandRouteOptions = {
  createFetcher: (districtSlug: string, menuSlug: string) => MenuFetcher;
  districtMenuConfig: DistrictMenuConfig;
  slackVerificationToken?: string;
  timezone: string;
};

const BodySchema = z.object({
  token: z.string(),
  team_id: z.string(),
  team_domain: z.string(),
  channel_id: z.string(),
  channel_name: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  command: z.string(),
  text: z.string(),
  response_url: z.string(),
  trigger_id: z.string(),
  api_app_id: z.string(),
});

type DailyMenu = {
  date: CalendarDate;
  menu?: Menu;
};

export function slashCommandRoute({
  createFetcher,
  districtMenuConfig,
  slackVerificationToken,
  timezone,
}: SlashCommandRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const { token, ...body } = BodySchema.parse(req.body);
    console.error(JSON.stringify(body));

    if (token !== slackVerificationToken || slackVerificationToken == null) {
      res.status(403).end();
      return;
    }

    const parsed = parseCommand(body.command, { districtMenuConfig, timezone });
    if (!parsed) {
      res.status(200).end();
      return;
    }

    const fetcher = createFetcher(parsed.districtSlug, parsed.menuSlug);

    const menus = await getMenusForDates({
      ...parsed,
      fetcher,
    });

    res.json(
      blocksForMenus(
        parsed.dates.map((date, i) => {
          const menu = menus[i];
          return { date, menu };
        }),
      ),
    );
  };
}

type ParsedCommand = {
  dates: CalendarDate[];
  districtSlug: string;
  menuSlug: string;
};

type ParseCommandOptions = Pick<AppOptions, "districtMenuConfig" | "timezone">;

function parseCommand(
  command: string,
  { districtMenuConfig, timezone }: ParseCommandOptions,
): ParsedCommand | undefined {
  const weekdays = getWeekDays({
    referenceDate: new Date(),
    timezone,
  });

  const districtSlug = Object.keys(districtMenuConfig)[0];

  const menuSlug = Object.keys(districtMenuConfig[districtSlug].menus)[0];

  return {
    dates: weekdays.map(({ date }) => date),
    districtSlug,
    menuSlug,
  };
}

function blocksForMenus(menus: DailyMenu[]): any {
  const firstDay = menus[0].date;

  return {
    blocks: [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: `Menu for the week of ${formatCalendarDate(firstDay)}`,
              },
            ],
          },
          {
            type: "rich_text_list",
            style: "bullet",
            elements: menus.map(({ date, menu }) => ({
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: `${formatCalendarDate(date)}:`,
                },
                textElementForMenu(menu),
              ].filter(Boolean),
            })),
          },
        ],
      },
    ],
  };

  function textElementForMenu(menu?: Menu) {
    if (menu == null) {
      return;
    }

    if (menu.note && menu.categories.length === 0) {
      return {
        type: "text",
        text: menu.note,
      };
    }

    const items = interestingItems(menu.categories);
    if (items.length === 1) {
      return {
        type: "text",
        text: items[0][1].name,
      };
    }

    return {
      type: "text",
      text: items.map(([_, i]) => i.name).join(", "),
    };
  }
}
