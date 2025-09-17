//dwellwell-api/src/routes/lookup/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import appliances from './appliances';

const router = Router();
router.use(requireAuth);

// This provides your DB-first search the modal already calls:
// GET /api/lookup/appliances?q=...
router.use('/appliances', appliances);

export default router;
