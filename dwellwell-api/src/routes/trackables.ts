import express from 'express';
import { getTrackables, createTrackable } from '../controllers/trackables';

const router = express.Router();

router.get('/', getTrackables);
router.post('/', createTrackable);

export default router;