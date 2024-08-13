import { MenuResponse, parseResponse } from "./parse";

export type LoadMenuMiddleware = (
  options: LoadMenuOptions,
  next: () => Promise<string>,
) => Promise<string>;

export type LoadMenuOptions = {
  readonly middleware: LoadMenuMiddleware[];
  readonly districtID: number;
  readonly menuID: number;
};

export async function loadMenu(
  options: LoadMenuOptions,
): Promise<MenuResponse> {
  const workingMiddleware = [...options.middleware, fetchMenuJSON];

  const next = (): Promise<string> => {
    const nextMiddleware = workingMiddleware.shift();
    if (nextMiddleware) {
      return nextMiddleware(options, next);
    }
    throw new Error("Out of middleware.");
  };

  const firstMiddleware = workingMiddleware.shift();

  if (firstMiddleware == null) {
    throw new Error("No first middleware.");
  }

  const json = await firstMiddleware(options, next);

  return parseResponse(JSON.parse(json));
}

async function fetchMenuJSON(
  { districtID, menuID }: LoadMenuOptions,
  _next: LoadMenuMiddleware,
): Promise<string> {
  const res = await fetch(
    `https://myschoolmenus.com/api/public/menus/${menuID}`,
    {
      credentials: "include",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "x-district": String(districtID),
      },
      method: "GET",
    },
  );

  if (!res.ok) {
    throw new Error(`HTTP request failed: ${res.status}`);
  }

  return await res.text();
}
