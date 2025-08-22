import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  '/upload-image',
  requireAuth,
  upload.single('image'),
  async (req, res) => {
    const userId = (req as any).user?.id as string;
    const homeId = (req.body?.homeId as string) || (req.query?.homeId as string);
    if (!homeId) return res.status(400).json({ error: 'HOME_ID_REQUIRED' });
    if (!req.file) return res.status(400).json({ error: 'IMAGE_REQUIRED' });

    const baseDir = path.join(process.cwd(), 'uploads', 'homes', homeId);
    await fs.mkdir(baseDir, { recursive: true });

    const filename = 'main.jpg';
    const full = path.join(baseDir, filename);

    await sharp(req.file.buffer).rotate().resize(1600, 1200, { fit: 'inside' }).jpeg({ quality: 82 }).toFile(full);

    const publicPath = `/uploads/homes/${homeId}/${filename}`;
    return res.json({ filename: publicPath });
  }
);

export default router;
