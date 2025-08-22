import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import list from './list';
import create from './create';
import update from './update';
import remove from './remove';

const router = Router();
router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.put('/:roomId', update);
router.delete('/:roomId', remove);
export default router;
