import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireAdmin } from '../../middleware/requireAdmin';

import adminMetrics from './adminMetrics';
import adminTrackableList from './adminTrackableList';
import adminTrackableResources from './adminTrackableResources';
import adminWhatsNew from './adminWhatsNew';
import adminHomes from './homes';
import adminTaskTemplates from './task-templates';
import adminUsers from './users';
import adminTaskGenIssues from "./task-generation-issues";

const router = Router();
router.use(requireAuth, requireAdmin);

router.use('/metrics', adminMetrics);
router.use('/trackables', adminTrackableList);
router.use('/resources', adminTrackableResources);
router.use('/whats-new', adminWhatsNew);
router.use('/homes', adminHomes);
router.use('/task-templates', adminTaskTemplates);
router.use('/users', adminUsers);
router.use('/task-generation-issues', adminTaskGenIssues);

export default router;
