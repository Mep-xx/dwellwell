//dwellwell-api/src/routes/tasks/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import list from './list';
import complete from './complete';
import snooze from './snooze';

const router = Router();
router.use(requireAuth);
router.get('/', list);
router.post('/:taskId/complete', complete);
router.post('/:taskId/snooze', snooze);
export default router;
