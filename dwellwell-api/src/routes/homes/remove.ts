import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { Forbidden, NotFound } from '../../utils/AppError';

const router = Router();

router.delete(
  '/:homeId',
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    if (!userId) throw Forbidden();

    const { homeId } = req.params as any;
    const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!home) throw NotFound('HOME_NOT_FOUND');

    // Consider cascades in Prisma schema; if not set, you may need manual deletes
    await prisma.home.delete({ where: { id: homeId } });
    res.json({ ok: true });
  })
);

export default router;
