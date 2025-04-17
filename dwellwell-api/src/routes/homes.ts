import { Router } from 'express';
import { getHomes, createHome } from '../controllers/home';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/', requireAuth, getHomes);
router.post('/', requireAuth, createHome);

export default router;
