import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { Forbidden, NotFound } from '../../utils/AppError';
import { updateHomeSchema } from './schema';

const router = Router();

router.put(
  '/:homeId',
  validate(updateHomeSchema),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) throw Forbidden();

    const { homeId } = req.params as any;
    const existing = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!existing) throw NotFound('HOME_NOT_FOUND');

    const updated = await prisma.home.update({
      where: { id: homeId },
      data: { ...req.body },
    });
    res.json(updated);
  })
);

export default router;
