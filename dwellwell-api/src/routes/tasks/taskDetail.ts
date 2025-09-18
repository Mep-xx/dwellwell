// dwellwell-api/src/routes/tasks/taskDetail.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { prisma } from '../../db/prisma';

/**
 * Returns a *rich* view of a user task suitable for the Task Runner:
 * - user task (title, description, dueDate, estimatedTimeMinutes, etc.)
 * - resolved steps/resources/equipment:
 *    - if task has local overrides (steps/equipmentNeeded/resources on UserTask) use those
 *    - otherwise, fall back to TaskTemplate fields (steps/resources from template)
 * - includes room/home/trackable minimal info for breadcrumbs
 */
export default asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  const { taskId } = req.params as { taskId: string };

  const task = await prisma.userTask.findFirst({
    where: { id: taskId, userId },
    include: {
      taskTemplate: true,
      room: { select: { id: true, name: true, homeId: true } },
      trackable: {
        select: {
          id: true,
          userDefinedName: true,
          brand: true,
          model: true,
          roomId: true,
          homeId: true,
        },
      },
    },
  });

  if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });

  // Resolve steps/resources/equipment with sensible fallback to template
  const tpl = task.taskTemplate ?? null;

  // Your schema stores steps/equipmentNeeded on both UserTask and TaskTemplate
  // types: UserTask.steps Json? (you store array of strings or richer objects)
  //        TaskTemplate.steps String[]
  const steps =
    (Array.isArray(task.steps) && task.steps.length > 0
      ? task.steps
      : Array.isArray(tpl?.steps)
      ? tpl!.steps
      : []) as any[];

  const equipmentNeeded =
    (Array.isArray(task.equipmentNeeded) && task.equipmentNeeded.length > 0
      ? task.equipmentNeeded
      : Array.isArray(tpl?.equipmentNeeded)
      ? tpl!.equipmentNeeded
      : []) as any[];

  // resources shape is Json on both; common practice you’ve used is [{label, url, type?}]
  const resources =
    (Array.isArray(task.resources) && task.resources.length > 0
      ? task.resources
      : Array.isArray((tpl as any)?.resources)
      ? (tpl as any).resources
      : []) as Array<{ label?: string; url?: string; type?: string }>;

  // Basic “parts” extraction: treat any resource with type === 'buy' OR amazon url as a Part
  const parts = resources.filter(
    (r) =>
      (r.type && r.type.toLowerCase() === 'buy') ||
      (r.url && /amazon\./i.test(r.url))
  );

  res.json({
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      completedDate: task.completedDate,
      estimatedTimeMinutes: task.estimatedTimeMinutes,
      estimatedCost: task.estimatedCost,
      criticality: task.criticality,
      recurrenceInterval: task.recurrenceInterval,
      canDefer: task.canDefer,
      deferLimitDays: task.deferLimitDays,
      canBeOutsourced: task.canBeOutsourced,
      category: task.category,
      imageUrl: task.imageUrl,
      icon: task.icon,
    },
    context: {
      room: task.room,
      trackable: task.trackable,
    },
    template: tpl
      ? {
          id: tpl.id,
          title: tpl.title,
          summary: tpl.description ?? null,
          version: tpl.version,
          state: tpl.state,
          estimatedTimeMinutes: tpl.estimatedTimeMinutes,
          estimatedCost: tpl.estimatedCost,
          imageUrl: tpl.imageUrl,
          icon: tpl.icon,
          category: tpl.category,
        }
      : null,
    content: {
      steps, // strings or {title, body, mediaUrl} both supported
      equipmentNeeded,
      resources,
      parts,
    },
  });
});
