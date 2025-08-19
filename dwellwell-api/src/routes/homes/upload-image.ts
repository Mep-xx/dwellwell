// src/routes/homes/upload-image.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Build the origin (configurable for prod/CDN via env)
function publicBase(req: express.Request) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

// Mounted in index.ts as: app.use('/api', uploadHomeImageRoute)
// Final endpoint: POST /api/homes/upload-image?homeId=...
router.post('/homes/upload-image', upload.single('image'), async (req, res) => {
  const homeId = req.query.homeId as string;

  if (!homeId) {
    return res.status(400).json({ error: 'Missing homeId in query' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Write to project-root/uploads/homes/<homeId>/main.jpg
  const uploadsRoot = path.resolve(__dirname, '../../../uploads/homes');
  const homeFolder = path.join(uploadsRoot, homeId);
  const filePath = path.join(homeFolder, 'main.jpg');

  try {
    await fs.mkdir(homeFolder, { recursive: true });
    await fs.writeFile(filePath, req.file.buffer);

    // ✅ Return the correct public URL under /uploads (NOT /api/uploads)
    const relativePath = `/uploads/homes/${homeId}/main.jpg`;
    const url = `${publicBase(req)}${relativePath}`;

    return res.status(200).json({
      url,                           // absolute URL (useful if you want to show directly)
      path: relativePath,            // '/uploads/homes/<id>/main.jpg'
      filename: `homes/${homeId}/main.jpg`, // <-- compatibility with existing client
    });

  } catch (err) {
    console.error('❌ Failed to save uploaded image:', err);
    return res.status(500).json({ error: 'Failed to save uploaded image' });
  }
});

export default router;
