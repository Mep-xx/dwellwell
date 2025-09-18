// dwellwell-api/src/routes/index.ts
import { Router, Request, Response, NextFunction } from "express";

// keep using your existing per-folder index files:
import homesRouter from './homes';
import trackablesRouter from './trackables';
import tasksRouter from './tasks';
import catalogRouter from './catalog';
import aiRouter from './ai';
import lookupRouter from './lookup';
import roomsRouter from "./rooms";

import adminRouter from './admin';

import mapboxRouter from './mapbox';

const router = Router();

// Simple health check (optional)
router.get("/health", (_req, res) => res.json({ ok: true }));

// Most of your child routers already apply requireAuth internally.
// For Homes, you’ve been mounting the folder’s index directly; keep that behavior:
router.use('/homes', homesRouter);
router.use('/rooms', roomsRouter);

// Core feature routers:
router.use('/trackables', trackablesRouter);
router.use('/tasks', tasksRouter);

// Catalog-first search + AI fallback:
router.use('/catalog', catalogRouter);
router.use('/ai', aiRouter);
router.use('/lookup', lookupRouter);

router.use('/admin', adminRouter);

router.use('/mapbox', mapboxRouter);

router.use((req: Request, res: Response) => {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

// Basic error passthrough
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API ERROR]", err);
  res.status(err?.status || 500).json({ error: "SERVER_ERROR", message: err?.message || "Unexpected error" });
});

export default router;