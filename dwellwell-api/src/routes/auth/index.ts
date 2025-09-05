// dwellwell-api/src/routes/auth/index.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import login from './login';
import logout from './logout';
import refresh from './refresh';
import signup from './signup';
import authGoogle from './authGoogle'

const router = Router();

// Basic IP-based limits (tune as needed)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REFRESH_MAX ?? (process.env.NODE_ENV === 'production' ? 60 : 10000)), // dev-friendly
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refreshLimiter, refresh);
router.post('/authGoogle', authGoogle);

export default router;
