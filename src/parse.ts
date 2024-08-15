import { parse as parseDate } from "date-fns";
import z, { ZodError, ZodIssueCode } from "zod";

export type MenuResponse = z.infer<typeof ResponseSchema>;

export function parseResponse(input: unknown): z.infer<typeof ResponseSchema> {
  try {
    return ResponseSchema.parse(input);
  } catch (err: any) {
    console.error(formatError(err, input));
    throw new Error("Parse failed (see output for details)");
  }
}

function formatError(e: ZodError, input: any): string {
  const lines: string[] = [];
  buildErrorMessage(e, 0, lines);
  return lines.join("\n");

  function buildErrorMessage(
    e: ZodError,
    indentLevel: number,
    lines: string[],
  ) {
    const indent = new Array(indentLevel).fill("  ").join("");

    e.issues.forEach((issue) => {
      let message = issue.message;

      if (issue.code === ZodIssueCode.invalid_type) {
        message = `${message} (expected ${issue.expected}, got ${issue.received})`;
      }

      lines.push(`${indent}${issue.code} ${message}, ${issue.path.join(".")}`);

      const context = issue.path
        .slice(0, issue.path.length - 2)
        .reduce((obj, key) => {
          return obj == null ? obj : obj[key];
        }, input);

      lines.push(`${indent}   context: ${JSON.stringify(context)}`);

      switch (issue.code) {
        case ZodIssueCode.invalid_union:
          issue.unionErrors.forEach((e) => {
            buildErrorMessage(e, indentLevel + 1, lines);
          });
          break;
      }
    });
  }
}

const DateSchema = z
  .string()
  .transform((s) => parseDate(s, "yyyy-MM-dd", new Date()));

const DisplayItemSchema = z.object({
  item: z.union([z.string(), z.number().int()]),
  name: z.string(),
  type: z.string(),
  weight: z.number().int(),
});

const DaySettingSchema = z.object({
  current_display: z.array(DisplayItemSchema),
  available_recipes: z.array(z.number().int()),
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
  day: DateSchema,
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

const ResponseSchema = z.object({
  data: z.object({
    menu_month: z.coerce.date(),
    menu_month_calendar: z
      .array(CalendarDaySchema.nullable())
      .transform(
        (ar) => ar.filter(Boolean) as z.infer<typeof CalendarDaySchema>[],
      ),
  }),
});
