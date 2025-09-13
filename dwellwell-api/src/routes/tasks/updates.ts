// dwellwell-api/src/routes/tasks/updates.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { trackableId } = req.query as any;

  const where: any = { userId, archivedAt: null, taskTemplateId: { not: null } };
  if (trackableId) where.trackableId = trackableId;

  const tasks = await prisma.userTask.findMany({
    where,
    include: { taskTemplate: true },
  });

  const updates: Array<{
    userTaskId: string;
    sourceTemplateId: string;
    currentVersion: number;
    latestVersion: number;
    changedFields: string[];
    isOverridden: boolean;
  }> = [];

  for (const t of tasks) {
    const tpl = t.taskTemplate;
    if (!tpl) continue;
    if (tpl.state !== 'VERIFIED') continue;

    const currentVersion = t.sourceTemplateVersion ?? 0;
    if (tpl.version > currentVersion) {
      const SNAP = [
        'title','description','recurrenceInterval','criticality',
        'estimatedTimeMinutes','estimatedCost','canBeOutsourced','canDefer',
        'deferLimitDays','category','icon','imageUrl','steps','equipmentNeeded','resources',
      ] as const;

      const changedFields: string[] = [];
      for (const f of SNAP) {
        const a = (t as any)[f];
        const b = (tpl as any)[f];
        if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) {
          changedFields.push(f);
        }
      }

      // cast overriddenFields safely
      const overridden = Array.isArray(t.overriddenFields)
        ? (t.overriddenFields as unknown[]).map(String)
        : ([] as string[]);

      updates.push({
        userTaskId: t.id,
        sourceTemplateId: tpl.id,
        currentVersion,
        latestVersion: tpl.version,
        changedFields,
        isOverridden: overridden.some((f) => changedFields.includes(f)),
      });
    }
  }

  res.json({ updates });
});
