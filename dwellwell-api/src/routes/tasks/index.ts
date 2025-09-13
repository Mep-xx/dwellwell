// /dwellwell-api/src/routes/tasks/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import list from './list';
import complete from './complete';
import snooze from './snooze';
import pause from './pause';
import resume from './resume';
import archive from './archive';
import unarchive from './unarchive';
import updates from './updates';
import templateDiff from './templateDiff';
import applyTemplateUpdates from './applyTemplateUpdates';

const router = Router();
router.use(requireAuth);

router.get('/', list);

// template adoption helpers
router.get('/updates', updates);
router.get('/:taskId/template-diff', templateDiff);
router.post('/apply-template-updates', applyTemplateUpdates);

// task status actions
router.post('/:taskId/complete', complete);
router.post('/:taskId/snooze', snooze);
router.post('/:taskId/pause', pause);
router.post('/:taskId/resume', resume);
router.post('/:taskId/archive', archive);
router.post('/:taskId/unarchive', unarchive);

export default router;