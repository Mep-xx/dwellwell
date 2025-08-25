import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { prisma } from '../../db/prisma';
import { requireAuth } from "../../middleware/requireAuth";
import { homeIdParam } from "./schema";

const upload = multer({ dest: "uploads/tmp" });
const router = Router();

router.post("/:id/image", requireAuth, upload.single("image"), async (req: Request, res: Response) => {
  const { id } = homeIdParam.parse(req.params);
  const userId = req.user!.id;

  const home = await prisma.home.findFirst({ where: { id, userId } });
  if (!home) return res.status(404).json({ error: "HOME_NOT_FOUND" });

  if (!req.file) return res.status(400).json({ error: "NO_FILE" });

  const dir = path.join("uploads", "homes", id);
  await fs.mkdir(dir, { recursive: true });

  const finalPath = path.join(dir, `${Date.now()}_${req.file.originalname}`);
  await fs.rename(req.file.path, finalPath);

  const imageUrl = `/${finalPath.replace(/\\+/g, "/")}`;

  const updated = await prisma.home.update({ where: { id }, data: { imageUrl } });
  res.json(updated);
});

export default router;
