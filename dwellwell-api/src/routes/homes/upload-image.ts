// src/routes/homes/upload-image.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

router.post('/homes/upload-image', upload.single('image'), async (req, res) => {
  const homeId = req.query.homeId as string;

  if (!homeId) {
    return res.status(400).json({ error: 'Missing homeId in query' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadsRoot = path.resolve(__dirname, '../../../uploads/homes');
  const homeFolder = path.join(uploadsRoot, homeId);
  const filePath = path.join(homeFolder, 'main.jpg');

  try {
    fs.mkdirSync(homeFolder, { recursive: true });
    fs.writeFileSync(filePath, req.file.buffer);

    // Respond with relative URL used by frontend
    return res.status(200).json({
      filename: `homes/${homeId}/main.jpg`, // this is what your frontend expects
    });
  } catch (err) {
    console.error('❌ Failed to save uploaded image:', err);
    return res.status(500).json({ error: 'Failed to save uploaded image' });
  }
});

export default router;
