import { Router } from 'express';

import auth from './auth';
import homes from './homes';
import rooms from './rooms';
import tasks from './tasks';
import trackables from './trackables';
import ai from './ai';            // folder with index.ts
import lookup from './lookup';    // folder with index.ts
import mapbox from './mapbox';
import admin from './admin';

const router = Router();

router.use('/auth', auth);
router.use('/homes', homes);
router.use('/rooms', rooms);
router.use('/tasks', tasks);
router.use('/trackables', trackables);
router.use('/ai', ai);
router.use('/lookup', lookup);
router.use('/mapbox', mapbox);
router.use('/admin', admin);

export default router;
