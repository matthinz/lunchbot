import { getWeekDays } from "./time-thinker";

describe("#getWeekDays", () => {
  const EXAMPLES = [
    {
      referenceDate: new Date("2024-08-22T15:18:26.156Z"),
      timezone: "America/Los_Angeles",
      expected: [
        {
          date: { year: 2024, month: 8, day: 19 },
          disposition: "past",
        },
        {
          date: { year: 2024, month: 8, day: 20 },
          disposition: "past",
        },
        {
          date: { year: 2024, month: 8, day: 21 },
          disposition: "past",
        },
        {
          date: { year: 2024, month: 8, day: 22 },
          disposition: "present",
        },
        {
          date: { year: 2024, month: 8, day: 23 },
          disposition: "future",
        },
      ],
    },
    {
      referenceDate: new Date("2024-08-23T01:18:26.156Z"), // 8/22 9:18 PM Eastern
      timezone: "America/Toronto",
      expected: [
        {
          date: { year: 2024, month: 8, day: 19 },
          disposition: "past",
        },
        {
          date: { year: 2024, month: 8, day: 20 },
          disposition: "past",
        },
        {
          date: { year: 2024, month: 8, day: 21 },
          disposition: "past",
        },
        {
          date: { year: 2024, month: 8, day: 22 },
          disposition: "past",
        },
        {
          date: { year: 2024, month: 8, day: 23 },
          disposition: "present",
        },
      ],
    },
  ];

  EXAMPLES.forEach(({ referenceDate, timezone, expected }) => {
    describe(`${referenceDate.toISOString()} in ${timezone}`, () => {
      it("returns correct days", () => {
        const actual = getWeekDays({
          currentDayTransitionTime: 12 * 60,
          referenceDate,
          timezone,
        });
        expect(actual).toEqual(expected);
      });
    });
  });
});
