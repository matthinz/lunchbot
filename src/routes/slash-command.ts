import { isBefore, isSameDay, isThisWeek, isToday, isTomorrow } from "date-fns";
import { Request, Response } from "express";
import { z } from "zod";
import { fileSystemCache } from "../fs-cache";
import { loadMenu } from "../menu";
import { AppOptions, MenuCalendarDay } from "../types";

type SlashCommandOptions = Pick<
  AppOptions,
  | "menuID"
  | "districtID"
  | "cacheTTLInMS"
  | "cacheDirectory"
  | "slackVerificationToken"
>;

type Result = {
  days: MenuCalendarDay[];
  description: string;
};

const BodySchema = z.object({
  token: z.string().optional(),
  team_id: z.string(),
  team_domain: z.string(),
  enterprise_id: z.string().optional(),
  enterprise_name: z.string().optional(),
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

export function slashCommand({
  districtID,
  menuID,
  cacheDirectory,
  cacheTTLInMS,
  slackVerificationToken,
}: SlashCommandOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    let body: z.infer<typeof BodySchema>;

    try {
      body = BodySchema.parse(req.body);
    } catch (err) {
      console.error(req.body);
      throw err;
    }

    if (body.token !== slackVerificationToken) {
      res.status(403).end();
      return;
    }

    const menu = await loadMenu({
      districtID,
      menuID,
      middleware: [
        fileSystemCache({
          cacheDirectory,
          ttlMS: cacheTTLInMS,
        }),
      ],
    });

    const result = parseInput(body.text, menu);

    res.json(buildResponse(result));
  };
}

function buildResponse(result: Result | undefined): any {
  if (!result) {
    return {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Couldn't find what's for lunch!",
          },
        },
      ],
    };
  }

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```" + JSON.stringify(result) + "```",
        },
      },
    ],
  };
}

function nextSchoolDay(menu: MenuCalendarDay[], asOf: Date = new Date()) {
  const sorted = [...menu].sort((a, b) => a.date.getTime() - b.date.getTime());

  let best: MenuCalendarDay | undefined;

  for (const d of sorted) {
    if (isSameDay(d.date, asOf)) {
      best = d;
      break;
    }

    if (isBefore(asOf, d.date)) {
      continue;
    }

    if (best == null) {
      best = d;
      continue;
    }

    if (isBefore(d.date, best.date)) {
      best = d;
      continue;
    }
  }

  return best;
}

function parseInput(
  input: string,
  allDays: MenuCalendarDay[],
): Result | undefined {
  input = input.trim().toLowerCase();

  let day: MenuCalendarDay | undefined;

  switch (input) {
    case "":
      day = nextSchoolDay(allDays, new Date());

      return day
        ? {
            days: [day],
            description: "the next school day",
          }
        : undefined;

    case "today":
      day = allDays.find((d) => isToday(d.date));
      return day
        ? {
            days: [day],
            description: "today",
          }
        : undefined;

    case "tomorrow":
      day = allDays.find((d) => isTomorrow(d.date));
      return day
        ? {
            days: [day],
            description: "tomorrow",
          }
        : undefined;

    case "this week":
      const days = allDays.filter((d) => isThisWeek(d.date));
      return allDays.length > 0
        ? {
            days,
            description: "this week",
          }
        : undefined;
  }
}
