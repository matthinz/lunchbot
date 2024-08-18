import { Request, Response } from "express";
import { z } from "zod";
import {
  calendarDateFrom,
  calendarMonthOf,
  isSameCalendarDate,
} from "../calendar-dates";
import { AppOptions, MenuCalendarDay, MenuFetcher } from "../types";

type SlashCommandOptions = Pick<AppOptions, "slackVerificationToken"> & {
  fetcher: MenuFetcher;
};

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
  slackVerificationToken,
  fetcher,
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

    const menu = await fetcher(calendarMonthOf(new Date()));

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

function parseInput(
  input: string,
  allDays: MenuCalendarDay[],
): Result | undefined {
  input = input.trim().toLowerCase();

  switch (input) {
    case "":
    case "today":
      const date = calendarDateFrom(new Date());
      const day = allDays.find((d) => isSameCalendarDate(d.date, date));

      return day
        ? {
            days: [day],
            description: "today",
          }
        : undefined;
  }
}
