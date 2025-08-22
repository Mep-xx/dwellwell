import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import list from './list';
import create from './create';
import update from './update';
import remove from './remove';
import uploadImage from './upload-image';
import summary from './summary'; // keep if you use it

const router = Router();
router.use(requireAuth);
router.get('/', list);
router.post('/', create);
router.put('/:homeId', update);
router.delete('/:homeId', remove);
router.post('/upload-image', uploadImage);
router.get('/:homeId/summary', summary);
export default router;
