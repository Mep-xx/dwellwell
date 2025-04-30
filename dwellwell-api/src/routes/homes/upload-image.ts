// src/routes/homes/upload-image.ts
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = express.Router();

// Configure multer for upload
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../../uploads'), // server folder
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `home-${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filename = req.file.filename; // 🛠️ only return the filename
  return res.status(200).json({ filename });
});

export default router;
