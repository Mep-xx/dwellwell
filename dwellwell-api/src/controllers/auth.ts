// src/controllers/auth.ts
import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import bcrypt from 'bcrypt';
import { hashPassword } from '../utils/auth'; // keep your helper if you want

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(409).json({ message: 'Email is already in use' });

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, role: 'user' },
    });

    // Usually you’d also log them in here; leaving as-is from your code
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User fetched from DB:', user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role }, // ✅ include role
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
    console.log('Generated token payload:', jwt.decode(accessToken));

    const refreshToken = jwt.sign(
      { userId: user.id }, // refresh can be minimal
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    // ✅ dev-friendly cookie options so it actually sets on http://localhost
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Missing refresh token' });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload & { userId: string };

    // fetch current role
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    // ✅ always include role in the new access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    return res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};
