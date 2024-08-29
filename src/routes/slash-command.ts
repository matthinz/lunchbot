import { Request, Response } from "express";
import { z } from "zod";
import { getWeekDays } from "../time-thinker";
import { AppOptions, CalendarDate, DistrictMenuConfig } from "../types";

type SlashCommandRouteOptions = {
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

export function slashCommandRoute({
  districtMenuConfig,
  slackVerificationToken,
  timezone,
}: SlashCommandRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const { token, ...body } = BodySchema.parse(req.body);
    if (token !== slackVerificationToken || slackVerificationToken == null) {
      res.status(403).end();
      return;
    }

    const parsed = parseCommand(body.command, { districtMenuConfig, timezone });
    if (!parsed) {
      res.status(200).end();
    }

    res.json({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*It's 80 degrees right now.*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Partly cloudy today and tomorrow",
          },
        },
      ],
    });
  };
}

type ParsedCommand = {
  dates: CalendarDate[];
  district?: string;
  menu?: string;
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

  return {
    dates: weekdays.map(({ date }) => date),
  };
}
