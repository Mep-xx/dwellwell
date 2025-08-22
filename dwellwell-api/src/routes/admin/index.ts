import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireAdmin } from '../../middleware/requireAdmin';

import adminMetrics from '../admin/adminMetrics';
import adminTrackableList from '../admin/adminTrackableList';
import adminTrackableResources from '../admin/adminTrackableResources';
import adminWhatsNew from '../admin/adminWhatsNew';
import adminHomes from '../admin/homes';
import adminTaskTemplates from '../admin/task-templates';
import adminUsers from '../admin/users';

const router = Router();
router.use(requireAuth, requireAdmin);

router.use('/metrics', adminMetrics);
router.use('/trackables', adminTrackableList);
router.use('/resources', adminTrackableResources);
router.use('/whats-new', adminWhatsNew);
router.use('/homes', adminHomes);
router.use('/task-templates', adminTaskTemplates);
router.use('/users', adminUsers);

export default router;
