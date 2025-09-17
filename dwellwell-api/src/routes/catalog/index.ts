//dwellwell-api/src/routes/catalog/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import search from './search';
import findOrCreate from './findOrCreate';

const router = Router();
router.use(requireAuth);

// GET /api/catalog/search?q=...
router.get('/search', search);

// POST /api/catalog/find-or-create
router.post('/find-or-create', findOrCreate);

export default router;
