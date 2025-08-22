import { Router } from 'express';
import login from './login';
import logout from './logout';
import refresh from './refresh';
import signup from './signup';

const router = Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);

export default router;
