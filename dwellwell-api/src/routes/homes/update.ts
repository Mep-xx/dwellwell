// dwellwell-api/src/routes/homes/update.ts
import { Router } from "express";
import { z, ZodError } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
// If you use Prisma, uncomment/import your client:
// import { prisma } from "../../db"; // or wherever your Prisma client is

const router = Router();

// All fields optional so this behaves like a partial update
const UpdateBody = z.object({
  nickname: z.string().trim().min(1).optional(),
  squareFeet: z.coerce.number().int().positive().optional(),
  lotSize: z.coerce.number().positive().optional(),
  yearBuilt: z.coerce.number().int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  architecturalStyle: z.string().trim().optional(),
  numberOfRooms: z.coerce.number().int().min(0).optional(),
  apartment: z.string().trim().optional().nullable(),

  // ← these are now OPTIONAL
  hasCentralAir: z.boolean().optional(),
  hasBaseboard: z.boolean().optional(),

  boilerType: z.string().trim().optional(),
  roofType: z.string().trim().optional(),
  sidingType: z.string().trim().optional(),
  features: z.array(z.string().trim()).optional(),
  imageUrl: z.string().url().optional(),
}).strict();

router.put("/homes/:id", requireAuth, async (req, res) => {
  try {
    const data = UpdateBody.parse(req.body);

    // 🔽 Use whatever you already had here to write to your DB.
    // Example with Prisma (adjust to your project):
    // const updated = await prisma.home.update({
    //   where: { id: req.params.id },
    //   data,
    // });

    // If you don’t use Prisma, drop your existing update call back in:
    // const updated = await homesRepo.update(req.params.id, data);

    // For now, to prevent type errors while you paste your own call:
    // throw new Error("Replace with your actual DB update call");

    // Return your real updated record instead of this line:
    // return res.json(updated);

    // TEMP so file compiles if you want to test the validator only:
    return res.json({ id: req.params.id, ...data });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid home update",
        issues: err.issues,
      });
    }
    console.error("[homes:update] error", err);
    return res.status(500).json({ message: "Failed to update home" });
  }
});

export default router;
