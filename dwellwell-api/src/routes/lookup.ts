import { Router } from 'express';
import { searchApplianceCatalog } from '../controllers/lookup';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/appliances', searchApplianceCatalog);

export default router;
