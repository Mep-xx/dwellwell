import express from 'express';
import { getTrackables, createTrackable, deleteTrackable } from '../controllers/trackables';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTrackables);
router.post('/', createTrackable);
router.delete('/:id', deleteTrackable);

export default router;
