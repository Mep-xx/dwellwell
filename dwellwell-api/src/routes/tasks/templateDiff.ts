//dwellwell-api/src/routes/tasks/templateDiff.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

const SNAP = ['title','description','recurrenceInterval','criticality','estimatedTimeMinutes','estimatedCost','canBeOutsourced','canDefer','deferLimitDays','category','icon','imageUrl','steps','equipmentNeeded','resources'];

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { taskId } = req.params as any;

  const ut = await prisma.userTask.findFirst({ where: { id: taskId, userId }, include: { taskTemplate: true } });
  if (!ut || !ut.taskTemplate) return res.status(404).json({ error: 'TASK_OR_TEMPLATE_NOT_FOUND' });

  const diffs = SNAP.map(field => ({
    field,
    current: (ut as any)[field] ?? null,
    proposed: (ut.taskTemplate as any)[field] ?? null,
    overridden: Array.isArray(ut.overriddenFields) ? ut.overriddenFields.includes(field) : false,
  })).filter(d => JSON.stringify(d.current) !== JSON.stringify(d.proposed));

  res.json({
    userTaskId: ut.id,
    sourceTemplateId: ut.taskTemplateId,
    currentVersion: ut.sourceTemplateVersion ?? 0,
    latestVersion: ut.taskTemplate.version,
    diffs
  });
});
