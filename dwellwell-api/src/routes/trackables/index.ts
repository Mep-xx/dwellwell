import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import list from './list';
import create from './create';
import update from './update';
import remove from './remove';
import pause from './pause';
import resume from './resume';
import retire from './retire';
import replace from './replace';
import revive from './revive';

const router = Router();
router.use(requireAuth);

router.get('/', list);
router.post('/', create);
router.put('/:trackableId', update);

// lifecycle
router.post('/:trackableId/pause', pause);
router.post('/:trackableId/resume', resume);
router.post('/:trackableId/retire', retire);
router.post('/:trackableId/replace', replace);
router.post('/:trackableId/revive', revive);

// legacy hard delete (keep, but recommend retire instead)
router.delete('/:trackableId', remove);

export default router;
