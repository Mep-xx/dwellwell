// dwellwell-api/src/routes/admin/adminTrackableResources.ts
import { Router } from 'express';
import { prisma } from '../../db/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Base storage
const baseUploadDir = path.join(process.cwd(), 'uploads', 'trackables');
fs.mkdirSync(baseUploadDir, { recursive: true });

const upload = multer({
  dest: baseUploadDir,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

// GET resources for a trackable
router.get('/:trackableId/resources', async (req, res) => {
  const { trackableId } = req.params;
  if (!trackableId) return res.status(400).json({ error: 'Missing trackableId' });
  const resources = await prisma.trackableResource.findMany({
    where: { trackableId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(resources);
});

// Add a video/external url
router.post('/:trackableId/resources/url', async (req, res) => {
  const { trackableId } = req.params;
  const { name, url, type } = req.body as { name?: string; url?: string; type?: 'video' | 'pdf' };
  if (!trackableId || !url || !type) return res.status(400).json({ error: 'Missing fields' });

  const created = await prisma.trackableResource.create({
    data: { trackableId, name: name || 'Link', url, type },
  });
  res.json(created);
});

// Upload PDF manual
router.post('/:trackableId/resources/upload', upload.single('file'), async (req, res) => {
  const { trackableId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname || '') || '.pdf';
  const targetDir = path.join(baseUploadDir, trackableId, 'manuals');
  fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, `${Date.now()}${ext}`);
  fs.renameSync(req.file.path, targetPath);

  const relPath = path.relative(process.cwd(), targetPath).replace(/\\/g, '/');

  const created = await prisma.trackableResource.create({
    data: {
      trackableId,
      type: 'pdf',
      name: req.file.originalname || 'Manual',
      filePath: relPath,
    },
  });

  res.json(created);
});

// Delete resource
router.delete('/resources/:id', async (req, res) => {
  const { id } = req.params;
  const resource = await prisma.trackableResource.findUnique({ where: { id } });
  if (!resource) return res.status(404).json({ error: 'Not found' });

  if (resource.filePath) {
    try {
      fs.unlinkSync(path.join(process.cwd(), resource.filePath));
    } catch { /* ignore */ }
  }

  await prisma.trackableResource.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
