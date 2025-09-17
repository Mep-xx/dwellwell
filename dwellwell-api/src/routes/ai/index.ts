//dwellwell-api/src/routes/ai/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import lookupAppliance from './lookupAppliance';
import identifyProductWeb from './identifyProductWeb';

const router = Router();
router.use(requireAuth);

router.get('/lookup-appliance', lookupAppliance);
router.get('/identify-product-web', identifyProductWeb); // optional

export default router;
