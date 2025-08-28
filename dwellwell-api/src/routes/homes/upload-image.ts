//dwellwell-api/src/routes/homes/upload-image.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../../db/prisma";
import { requireAuth } from "../../middleware/requireAuth";
import { homeIdParam } from "./schema";

const upload = multer({ dest: "uploads/tmp" });
const router = Router();

router.post("/:id/image", requireAuth, upload.single("image"), async (req: Request, res: Response) => {
  const { id } = homeIdParam.parse(req.params);

  if (!req.file) {
    return res.status(400).json({ error: "MISSING_FILE" });
  }

  // Ensure per-home directory
  const dir = path.join("uploads", "homes", id);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${Date.now()}_${req.file.originalname}`.replace(/\s+/g, "_");
  const finalPath = path.join(dir, filename);

  await fs.rename(req.file.path, finalPath);

  // URL returned to the client (note: express serves /uploads statically)
  const url = `/${finalPath.replace(/\\+/g, "/")}`; // e.g. /uploads/homes/<id>/<filename>

  // Persist to DB
  const updated = await prisma.home.update({
    where: { id },
    data: { imageUrl: url },
  });

  // Return both for convenience
  res.json({ url, home: updated });
});

export default router;
