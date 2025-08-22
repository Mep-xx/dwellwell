// dwellwell-api/src/routes/index.ts
import { Router } from 'express';

import auth from './auth';
import homes from './homes';
import rooms from './rooms';
import tasks from './tasks';
import trackables from './trackables';
import lookup from './lookup';
import mapbox from './mapbox';
import admin from './admin';

const router = Router();
router.use('/auth', auth);
router.use('/homes', homes);
router.use('/rooms', rooms);
router.use('/tasks', tasks);
router.use('/trackables', trackables);
router.use('/lookup', lookup);
router.use('/mapbox', mapbox);
router.use('/admin', admin);

export default router;
