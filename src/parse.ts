import z, { ZodError, ZodIssueCode } from "zod";

export type MenuResponse = z.infer<typeof ResponseSchema>;

export function parseResponse(input: unknown): z.infer<typeof ResponseSchema> {
  try {
    return ResponseSchema.parse(input);
  } catch (err: any) {
    console.error(
      "-----------------------------------------------------------",
    );
    reportError(err, input);
    console.error(
      "-----------------------------------------------------------",
    );
    throw new Error("Parse failed (see output for details)");
  }
}

function reportError(e: ZodError, input: any, indentLevel = 0) {
  const indent = new Array(indentLevel).fill("  ").join("");
  e.issues.forEach((issue) => {
    let message = issue.message;

    if (issue.code === ZodIssueCode.invalid_type) {
      message = `${message} (expected ${issue.expected}, got ${issue.received})`;
    }

    console.error(
      "%s%s %s %s",
      indent,
      issue.code,
      message,
      issue.path.join("."),
    );

    const context = issue.path
      .slice(0, issue.path.length - 2)
      .reduce((obj, key) => {
        return obj == null ? obj : obj[key];
      }, input);

    console.error("%s  context: %s", indent, context);

    switch (issue.code) {
      case ZodIssueCode.invalid_union:
        issue.unionErrors.forEach((e) => {
          reportError(e, indentLevel + 1);
        });
        break;
    }
  });
}
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
    .optional(),
});

const CalendarDaySchema = z.object({
  id: z.number().int(),
  day: z.coerce.date(),
  menu_month_id: z.number().int(),
  setting: z
    .string()
    .transform((s) => JSON.parse(s))
    .pipe(DaySettingSchema),
  setting_original: z
    .string()
    .transform((s) => JSON.parse(s))
    .pipe(DaySettingSchema),
  overwritten: z.boolean(),
});

const ResponseSchema = z.object({
  data: z.object({
    menu_month: z.coerce.date(),
    menu_month_calendar: z
      .array(z.unknown())
      .transform((ar) => ar.filter((day) => !!(day as any)?.setting))
      .pipe(z.array(CalendarDaySchema)),
  }),
});
