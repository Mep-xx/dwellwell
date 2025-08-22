import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { Forbidden } from '../../utils/AppError';
import { createHomeSchema } from './schema';

const router = Router();

router.post(
  '/',
  validate(createHomeSchema),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) throw Forbidden();
    const { address, city, state, zip, nickname, squareFeet, lotSize, yearBuilt, features, architecturalStyle } = req.body;
    const home = await prisma.home.create({
      data: { userId, address, city, state, zip, nickname, squareFeet, lotSize, yearBuilt, features, architecturalStyle },
    });
    res.status(201).json(home);
  })
);

export default router;
