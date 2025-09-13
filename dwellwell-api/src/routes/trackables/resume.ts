//dwellwell-api/src/routes/trackables/resume.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';
import { TrackableStatus } from '@prisma/client';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.params as any;
  const { mode = 'forward' } = req.body ?? {}; // 'forward' | 'catchup' | 'immediate' (safety)

  const t = await prisma.trackable.findFirst({
    where: { id: trackableId, home: { userId } },
  });
  if (!t) return res.status(404).json({ error: 'TRACKABLE_NOT_FOUND' });
  if (t.status === 'RETIRED') return res.status(400).json({ error: 'RETIRED' });

  await prisma.trackable.update({
    where: { id: t.id },
    data: { status: TrackableStatus.IN_USE },
  });

  // Unpause tasks and schedule next due smartly
  const tasks = await prisma.userTask.findMany({
    where: { trackableId: t.id, archivedAt: null, NOT: { pausedAt: null } },
  });

  const now = new Date();
  for (const task of tasks) {
    let newDue = task.dueDate;
    if (mode === 'forward') {
      // forward-only: today + cadence if we can infer cadence from recurrenceInterval like "3 months" or "90 days"
      newDue = computeForwardOnlyDue(now, task);
    } else if (mode === 'immediate') {
      newDue = now;
    } else {
      // catchup: keep lastDone+cadence logic—fallback to now if unknown
      newDue = computeCatchupDue(now, task);
    }

    await prisma.userTask.update({
      where: { id: task.id },
      data: { pausedAt: null, isTracking: true, dueDate: newDue },
    });
  }

  await prisma.lifecycleEvent.create({
    data: { userId, entity: 'trackable', entityId: t.id, action: 'resumed', metadata: { mode } },
  });

  res.json({ ok: true });

  function computeForwardOnlyDue(basis: Date, task: any) {
    const d = new Date(basis);
    const cad = (task.recurrenceInterval || '').toLowerCase();
    // naive parse: supports "90 days", "3 months", "1 year", "1 week"
    if (cad.includes('day')) d.setDate(d.getDate() + parseInt(cad));
    else if (cad.includes('week')) d.setDate(d.getDate() + 7 * parseInt(cad));
    else if (cad.includes('month')) d.setMonth(d.getMonth() + parseInt(cad));
    else if (cad.includes('year')) d.setFullYear(d.getFullYear() + parseInt(cad));
    else d.setDate(d.getDate() + 30);
    return d;
  }
  function computeCatchupDue(basis: Date, task: any) {
    // Fallback: if completedDate exists, add cadence; else default to forward
    if (!task.completedDate) return computeForwardOnlyDue(basis, task);
    const d = new Date(task.completedDate);
    return computeForwardOnlyDue(d, task);
  }
});
