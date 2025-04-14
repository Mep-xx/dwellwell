import { Router } from 'express';
import { searchApplianceCatalog } from '../controllers/lookup';

const router = Router();
router.get('/appliances', searchApplianceCatalog);

export default router;
