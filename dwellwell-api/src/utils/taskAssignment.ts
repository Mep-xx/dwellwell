import { prisma } from '../db/prisma';
import { TaskStatus, Prisma } from '@prisma/client';

function calculateInitialDueDate(recurrence: string): Date {
  const now = new Date();
  switch (recurrence) {
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      return now;
    case '3 months':
      now.setMonth(now.getMonth() + 3);
      return now;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      return now;
    default:
      return now;
  }
}

export async function assignTasksToRooms(homeId: string, userId: string) {
  const rooms = await prisma.room.findMany({ where: { homeId } });

  for (const room of rooms) {
    const templates = await prisma.taskTemplate.findMany({
      where: {
        category: room.type.toLowerCase(),
      },
    });

    for (const template of templates) {
      await prisma.userTask.create({
        data: {
          userId,
          roomId: room.id,
          taskTemplateId: template.id,
          sourceType: 'room',
          title: template.title,
          description: template.description ?? '',
          dueDate: calculateInitialDueDate(template.recurrenceInterval),
          status: TaskStatus.PENDING,
          itemName: room.name,
          category: template.category ?? '',
          location: room.name,
          estimatedTimeMinutes: template.estimatedTimeMinutes,
          estimatedCost: template.estimatedCost,
          criticality: template.criticality,
          deferLimitDays: template.deferLimitDays,
          canBeOutsourced: template.canBeOutsourced,
          canDefer: template.canDefer,
          recurrenceInterval: template.recurrenceInterval,
          taskType: template.taskType,
          steps: template.steps,
          equipmentNeeded: template.equipmentNeeded,
          resources: template.resources ?? [],
          imageUrl: template.imageUrl ?? null,
          icon: template.icon ?? null,
        } satisfies Prisma.UserTaskUncheckedCreateInput, // ✅ Ensures compatibility with scalar fields like roomId
      });
    }
  }

  console.log(`✅ Assigned room-based tasks to ${rooms.length} rooms`);
}
