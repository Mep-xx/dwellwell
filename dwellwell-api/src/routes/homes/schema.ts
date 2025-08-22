import { z } from 'zod';

export const createHomeSchema = z.object({
  body: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2),
    zip: z.string().optional(),
    nickname: z.string().optional(),
    squareFeet: z.number().int().positive().optional(),
    lotSize: z.number().positive().optional(),
    yearBuilt: z.number().int().min(1700).max(new Date().getFullYear()).optional(),
    features: z.array(z.string()).optional(),
    architecturalStyle: z.string().optional(),
  }),
});

export const updateHomeSchema = z.object({
  params: z.object({ homeId: z.string().uuid() }),
  body: createHomeSchema.shape.body.partial(),
});
