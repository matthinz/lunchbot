import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseResponse } from "./parse";

describe("#parseResponse", () => {
  async function loadAndParseFixture() {
    const json = JSON.parse(
      await readFile(path.join(__dirname, "../fixtures/menu.json"), "utf-8"),
    );
    return parseResponse(json);
  }
  it("parses fixture", async () => {
    await loadAndParseFixture();
  });

  it("parses setting json", async () => {
    const resp = await loadAndParseFixture();

    const day = resp.data.menu_month_calendar[0];

    expect(day).toBeTruthy();
    expect(typeof (day as any).setting).toEqual("object");
  });
  it("parses setting_original json", async () => {
    const resp = await loadAndParseFixture();

    const day = resp.data.menu_month_calendar[0];

    expect(day).toBeTruthy();
    expect(typeof (day as any).setting_original).toEqual("object");
  });

  it("parses a day with no menu items", async () => {
    const resp = await loadAndParseFixture();
    const day = resp.data.menu_month_calendar[0];

    expect(day).toEqual({
      id: 1002676025,
      day: new Date("2024-08-26T00:00:00.000Z"),
      menu_month_id: 15168103,
      setting: {
        current_display: [],
        available_recipes: [],
        hidden_items: [],
        days_off: {
          status: 1,
          description: "Teacher Workday (No School for Students)",
        },
      },
      setting_original: {
        current_display: [],
        available_recipes: [],
        hidden_items: [],
        days_off: {
          status: 1,
          description: "Teacher Workday (No School for Students)",
        },
      },
      overwritten: false,
    });
  });

  it("parses a day with menu items", async () => {
    const resp = await loadAndParseFixture();
    const day = resp.data.menu_month_calendar[3];

    expect(day).toEqual({
      id: 1002676029,
      day: new Date("2024-08-29T00:00:00.000Z"),
      menu_month_id: 15168103,
      setting: {
        current_display: [
          {
            item: "Lunch Entree",
            name: "Lunch Entree",
            type: "category",
            weight: 0,
          },
          {
            item: "orig_choice_of",
            name: "Choice of",
            type: "text",
            weight: 1,
          },
          {
            item: 1320008,
            name: "Pizza, Cheese, 10-cut, Wild Mike's",
            type: "recipe",
            weight: 2,
          },
          {
            item: "orig_or",
            name: "Or",
            type: "text",
            weight: 3,
          },
          {
            item: 1587738,
            name: "Wowbutter and Grape Jelly EZ Jammer Sandwich",
            type: "recipe",
            weight: 4,
          },
          {
            item: "cust_Or_1721676561528",
            name: "Or",
            type: "text",
            weight: 5,
          },
          {
            item: 1320243,
            name: "Bagel, Alternative Entree",
            type: "recipe",
            weight: 6,
          },
          {
            item: 1211685,
            name: "Protein Options - Served with Bagel",
            type: "recipe",
            weight: 7,
          },
          {
            item: "Vegetables",
            name: "Vegetables",
            type: "category",
            weight: 8,
          },
          {
            item: 1419919,
            name: "Early Release Salad Bar",
            type: "recipe",
            weight: 9,
          },
          {
            item: "Fruit",
            name: "Fruit",
            type: "category",
            weight: 10,
          },
          {
            item: 1218332,
            name: "Fruit, Rotating Selection",
            type: "recipe",
            weight: 11,
          },
          {
            item: 1327623,
            name: "Dried Fruit, Rotating Selection",
            type: "recipe",
            weight: 12,
          },
          {
            item: "Milk",
            name: "Milk",
            type: "category",
            weight: 14,
          },
          {
            item: 1210963,
            name: "1% Milk",
            type: "recipe",
            weight: 15,
          },
          {
            item: "cust_Or_1721676564578",
            name: "Or",
            type: "text",
            weight: 16,
          },
          {
            item: 1210965,
            name: "Nonfat Milk",
            type: "recipe",
            weight: 17,
          },
          {
            item: "Misc.",
            name: "Misc.",
            type: "category",
            weight: 18,
          },
          {
            item: 1211688,
            name: "Sunflower Seeds, Honey Roasted",
            type: "recipe",
            weight: 19,
          },
          {
            item: 1546155,
            name: "Misc. Salad Bar Items, As Available",
            type: "recipe",
            weight: 20,
          },
        ],
        available_recipes: [
          1210963, 1320243, 1211688, 1218332, 1320008, 1419919, 1210965,
          1211685, 1327623, 1587738, 1546155,
        ],
        hidden_items: [
          {
            item: "orig_with",
            name: "With",
            type: "text",
            weight: 0,
          },
          {
            item: "orig_and",
            name: "And",
            type: "text",
            weight: 1,
          },
          {
            item: "Grains",
            name: "Grains",
            type: "category",
            weight: 2,
          },
        ],
      },
      setting_original: {
        available_recipes: [
          1210963, 1320243, 1211688, 1218332, 1320008, 1419919, 1210965,
          1211685, 1327623, 1587738, 1546155,
        ],
        current_display: [
          {
            item: "Lunch Entree",
            name: "Lunch Entree",
            type: "category",
            weight: 0,
          },
          {
            item: 1320008,
            name: "Pizza, Cheese, 10-cut, Wild Mike's",
            type: "recipe",
            weight: 1,
          },
          {
            item: 1587738,
            name: "Wowbutter and Grape Jelly EZ Jammer Sandwich",
            type: "recipe",
            weight: 2,
          },
          {
            item: "Vegetables",
            name: "Vegetables",
            type: "category",
            weight: 3,
          },
          {
            item: 1419919,
            name: "Early Release Salad Bar",
            type: "recipe",
            weight: 4,
          },
          {
            item: "Fruit",
            name: "Fruit",
            type: "category",
            weight: 5,
          },
          {
            item: 1218332,
            name: "Fruit, Rotating Selection",
            type: "recipe",
            weight: 6,
          },
          {
            item: 1327623,
            name: "Dried Fruit, Rotating Selection",
            type: "recipe",
            weight: 7,
          },
          {
            item: "Grains",
            name: "Grains",
            type: "category",
            weight: 8,
          },
          {
            item: 1320243,
            name: "Bagel, Alternative Entree",
            type: "recipe",
            weight: 9,
          },
          {
            item: "Milk",
            name: "Milk",
            type: "category",
            weight: 10,
          },
          {
            item: 1210963,
            name: "1% Milk",
            type: "recipe",
            weight: 11,
          },
          {
            item: 1210965,
            name: "Nonfat Milk",
            type: "recipe",
            weight: 12,
          },
          {
            item: "Misc.",
            name: "Misc.",
            type: "category",
            weight: 13,
          },
          {
            item: 1211688,
            name: "Sunflower Seeds, Honey Roasted",
            type: "recipe",
            weight: 14,
          },
          {
            item: 1211685,
            name: "Protein Options - Served with Bagel",
            type: "recipe",
            weight: 15,
          },
          {
            item: 1546155,
            name: "Misc. Salad Bar Items, As Available",
            type: "recipe",
            weight: 16,
          },
        ],
        days_off: [],
        hidden_items: [
          {
            item: "orig_choice_of",
            name: "Choice of",
            type: "text",
            weight: 0,
          },
          {
            item: "orig_with",
            name: "With",
            type: "text",
            weight: 0,
          },
          {
            item: "orig_and",
            name: "And",
            type: "text",
            weight: 0,
          },
          {
            item: "orig_or",
            name: "Or",
            type: "text",
            weight: 0,
          },
        ],
      },
      overwritten: true,
    });
  });
});
