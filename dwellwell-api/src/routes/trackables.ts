import express from 'express';
import { getTrackables, createTrackable } from '../controllers/trackables';
import { deleteTrackable } from '../controllers/trackables';

const router = express.Router();

router.get('/', getTrackables);
router.post('/', createTrackable);
router.delete('/:id', deleteTrackable);

export default router;