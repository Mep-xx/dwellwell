import { Router } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { signup, login } from '../controllers/auth';

const router = Router();

// User signup & login
router.post('/signup', signup);
router.post('/login', login);

// Refresh access token using HttpOnly refresh token cookie
router.post('/refresh-token', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;

    // Optional: check jti or rotation if implemented
    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ message: err.message || 'Invalid refresh token' });
  }
});

// Clear refresh token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  return res.json({ message: 'Logged out successfully' });
});

export default router;
