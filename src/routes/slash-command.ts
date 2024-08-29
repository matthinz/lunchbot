import { Request, Response } from "express";
import { z } from "zod";

type SlashCommandRouteOptions = {
  slackVerificationToken?: string;
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
  slackVerificationToken,
}: SlashCommandRouteOptions): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    const { token, ...body } = BodySchema.parse(req.body);
    if (token !== slackVerificationToken || slackVerificationToken == null) {
      res.status(403).end();
      return;
    }

    console.error(body);
    res.status(200).end();
  };
}
