//dwellwell-api/src/routes/trackables/remove.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;

  // Verify ownership via related Home
  const t = await prisma.trackable.findFirst({
    where: { id: trackableId, home: { userId } },
  });
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });

  await prisma.trackable.delete({ where: { id: trackableId } });
  res.json({ ok: true });
});
