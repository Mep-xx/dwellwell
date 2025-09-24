//dwellwell-api/src/routes/settings/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import getSettings from './routes.get';
import putSettings from './routes.put';
import getNotifs from './routes.getNotifications';
import putNotifs from './routes.putNotifications';
import rotateIcal from './routes.rotateIcal';

const router = Router();
router.use(requireAuth);

router.get('/', getSettings);
router.put('/', putSettings);

router.get('/notifications', getNotifs);
router.put('/notifications', putNotifs);

router.post('/ical/rotate', rotateIcal);

export default router;
