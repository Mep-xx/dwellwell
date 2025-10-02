// dwellwell-api/src/routes/settings/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import getSettings from './get';
import updateSettings from './update';
import getNotifs from './get-notifications';
import updateNotifs from './update-notifications';
import rotateIcal from './rotate-ical';

const router = Router();
router.use(requireAuth);

router.get('/', getSettings);
router.put('/', updateSettings);

router.get('/notifications', getNotifs);
router.put('/notifications', updateNotifs);

router.post('/ical/rotate', rotateIcal);

export default router;