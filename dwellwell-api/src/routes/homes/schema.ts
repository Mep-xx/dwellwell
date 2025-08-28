//dwellwell-api/src/routes/homes/schema.ts
import { z } from "zod";

const toOptionalNumber = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  }, schema);

const toOptionalInt = () => toOptionalNumber(z.number().int().positive());
const toOptionalFloat = () => toOptionalNumber(z.number().positive());
const toOptionalBool = () =>
  z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "string") return v === "true";
    return Boolean(v);
  }, z.boolean());

export const createHomeSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  apartment: z.string().optional(),
  // let these through at create time so downstream flows work:
  nickname: z.string().max(120).optional(),
  architecturalStyle: z.string().max(120).optional(),
});

export const updateHomeSchema = z.object({
  nickname: z.string().max(120).optional(),
  squareFeet: toOptionalInt().optional(),
  lotSize: toOptionalFloat().optional(),
  yearBuilt: toOptionalInt().optional(),

  boilerType: z.string().max(80).optional(),
  roofType: z.string().max(80).optional(),
  sidingType: z.string().max(80).optional(),
  imageUrl: z.string().url().optional(),

  hasCentralAir: toOptionalBool().optional(),
  hasBaseboard: toOptionalBool().optional(),
  hasHeatPump: toOptionalBool().optional(),

  architecturalStyle: z.string().max(120).optional(),
  numberOfRooms: toOptionalInt().optional(),
  features: z.array(z.string().max(80)).optional(),
  apartment: z.string().optional(),

  isChecked: toOptionalBool().optional(),
});

export const homeIdParam = z.object({
  id: z.string().cuid(),
});

export type CreateHomeInput = z.infer<typeof createHomeSchema>;
export type UpdateHomeInput = z.infer<typeof updateHomeSchema>;
