import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;

export const generateToken = (user: { id: string; role: string }) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
};

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(raw: string, hashed: string) {
  return bcrypt.compare(raw, hashed);
}
