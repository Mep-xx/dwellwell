// dwellwell-api/src/routes/index.ts
import { Router } from 'express';

// keep using your existing per-folder index files:
import homesRouter from './homes';
import trackablesRouter from './trackables';
import tasksRouter from './tasks';
import catalogRouter from './catalog';
import aiRouter from './ai';
import lookupRouter from './lookup';
import admin from './admin';

// If you have other groups (admin, feedback, billing, etc.), import and add here too.

const router = Router();

// Most of your child routers already apply requireAuth internally.
// For Homes, you’ve been mounting the folder’s index directly; keep that behavior:
router.use('/homes', homesRouter);

// Core feature routers:
router.use('/trackables', trackablesRouter);
router.use('/tasks', tasksRouter);

// Catalog-first search + AI fallback:
router.use('/catalog', catalogRouter);
router.use('/ai', aiRouter);
router.use('/lookup', lookupRouter);

router.use('/admin', admin);

export default router;
