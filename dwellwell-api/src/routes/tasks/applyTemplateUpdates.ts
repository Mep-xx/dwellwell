//dwellwell-api/src/routes/tasks/applyTemplateUpdates.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

const SNAP = ['title','description','recurrenceInterval','criticality','estimatedTimeMinutes','estimatedCost','canBeOutsourced','canDefer','deferLimitDays','category','icon','imageUrl','steps','equipmentNeeded','resources'];

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { updates = [], overridePolicy = 'respect_overrides' } = req.body ?? {};

  const results: any[] = [];
  for (const u of updates) {
    const ut = await prisma.userTask.findFirst({ where: { id: u.userTaskId, userId }, include: { taskTemplate: true } });
    if (!ut || !ut.taskTemplate) { results.push({ userTaskId: u.userTaskId, skippedReason: 'TASK_OR_TEMPLATE_NOT_FOUND' }); continue; }

    const overr = new Set(Array.isArray(ut.overriddenFields) ? ut.overriddenFields as string[] : []);
    const applyList: string[] = u.fields?.length ? u.fields : SNAP;

    const fieldsToApply = applyList.filter(f => {
      if (overridePolicy === 'force_all') return true;
      if (overridePolicy === 'only_non_overridden') return !overr.has(f);
      // respect_overrides (default)
      return !overr.has(f);
    });

    const beforeSnap: any = {};
    const afterSnap: any = {};
    const data: any = {};
    for (const f of fieldsToApply) {
      beforeSnap[f] = (ut as any)[f] ?? null;
      data[f] = (ut.taskTemplate as any)[f] ?? null;
      afterSnap[f] = data[f];
    }

    const updated = await prisma.userTask.update({
      where: { id: ut.id },
      data: { ...data, sourceTemplateVersion: ut.taskTemplate.version },
    });

    await prisma.taskSnapshotHistory.create({
      data: {
        userTaskId: ut.id,
        fromVersion: ut.sourceTemplateVersion ?? 0,
        toVersion: ut.taskTemplate.version,
        fieldsChanged: fieldsToApply,
        snapshotBefore: beforeSnap,
        snapshotAfter: afterSnap,
      },
    });

    results.push({ userTaskId: ut.id, appliedFields: fieldsToApply, newVersion: ut.taskTemplate.version });
  }

  res.json({ results });
});
