import { z } from "zod";

export const DistrictMenuConfigSchema = z.record(
  z.string().regex(/^[a-z0-9]+$/),
  z.object({
    id: z.number().int(),
    menus: z.record(z.string().regex(/^[a-z0-9]+$/), z.number().int()),
  }),
);

export const DistrictMenuParamsSchema = z.object({
  districtID: z.coerce.number().int(),
  menuID: z.coerce.number().int(),
});
