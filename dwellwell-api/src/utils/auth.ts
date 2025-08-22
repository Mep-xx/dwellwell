// dwellwell-api/src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const ACCESS_SECRET = process.env.JWT_SECRET!;
export const signAccess = (p: { userId: string; role: string }) =>
  jwt.sign(p, ACCESS_SECRET, { expiresIn: '15m' });
export const verifyAccess = (t: string) => jwt.verify(t, ACCESS_SECRET);

export const hashPassword = (pwd: string) => bcrypt.hash(pwd, 10);
export const comparePassword = (raw: string, hashed: string) => bcrypt.compare(raw, hashed);
