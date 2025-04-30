// src/routes/homes/index.ts
import express from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { getHomes, createHome, updateHome, deleteHome } from '../../controllers/home';
import enrichHomeRoute from './enrich-home-OpenAI';
import { updateHomeIsChecked } from '../../controllers/home';
import uploadRoute from './upload-image'; // ⬅️  (Relative to homes folder)

const router = express.Router();

// ✅ Get all homes
router.get('/', requireAuth, getHomes);

// ✅ Create new home
router.post('/', requireAuth, createHome);

// ✅ Update home details (nickname, squareFeet, lotSize, yearBuilt, etc)
router.patch('/:id', requireAuth, updateHome);

router.patch('/:id/check', requireAuth, updateHomeIsChecked);

// ✅ Delete a home
router.delete('/:id', requireAuth, deleteHome);

// ✅ External routes (like OpenAI enrichment)
router.use(enrichHomeRoute);

router.use('/', uploadRoute);              // ⬅️  Attach it under /api/homes/

export default router;
