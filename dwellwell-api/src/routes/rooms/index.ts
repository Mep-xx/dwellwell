// dwellwell-api/src/routes/rooms/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import list from './list';
import create from './create';
import update from './update';
import remove from './remove';
import reorder from './reorder';
import show from './show';
import tasks from './tasks'; // NEW

const router = Router();
router.use(requireAuth);

router.get('/', list);
router.post('/', create);
router.put('/reorder', reorder);
router.get('/:roomId', show);
router.get('/:roomId/tasks', tasks); // NEW
router.put('/:roomId', update);
router.delete('/:roomId', remove);

export default router;
