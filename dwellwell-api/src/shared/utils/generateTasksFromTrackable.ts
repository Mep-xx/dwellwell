import { TaskStatus } from '../types/task';
import { taskTemplates } from '../data/mockTaskTemplates'; // adjust if you move it

export function generateTasksFromTrackable(trackable: {
  name: string;
  type?: string;
  category?: string;
  brand?: string;
  model?: string;
}) {
  console.log('🧠 Task gen input:', trackable);

  const templateTasks =
    (trackable.model && taskTemplates[trackable.model]) ||
    (trackable.type && taskTemplates[trackable.type]) ||
    [];

  const today = new Date();
  const defaultOffset = 7 * 24 * 60 * 60 * 1000; // 1 week in ms

  return templateTasks.map(template => ({
    title: template.title,
    description: template.description || '',
    dueDate: new Date(today.getTime() + defaultOffset),
    status: 'PENDING' as TaskStatus, // ✅ Force valid status only
    itemName: trackable.name,
    estimatedTimeMinutes: template.estimatedTimeMinutes ?? 30,
    criticality: template.criticality ?? 'medium',
    recurrenceInterval: template.recurrenceInterval ?? '3 months',
    canDefer: template.canDefer ?? true,
    deferLimitDays: template.deferLimitDays ?? 7,
    estimatedCost: template.estimatedCost ?? 0,
    canBeOutsourced: template.canBeOutsourced ?? false,
    icon: template.icon ?? '🧰',
    category: template.category ?? trackable.category ?? 'General',
    image: template.image ?? null,
    taskType: template.taskType ?? 'GENERAL',
    // trackableId and userId will be added later
  }));
}
