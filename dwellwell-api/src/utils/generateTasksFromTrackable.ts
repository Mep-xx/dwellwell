import { TaskStatus, TaskTemplate } from '../shared/types/task';
import { taskTemplates } from '../shared/data/mockTaskTemplates';
import { generateTasksFromOpenAI } from './generateTasksFromOpenAI';

function calculateInitialDueDate(interval: string | undefined): Date {
  const today = new Date();
  const multiplier =
    interval?.includes('month') ? 30 :
    interval?.includes('week') ? 7 :
    interval?.includes('day') ? 1 : 14;

  return new Date(today.getTime() + multiplier * 24 * 60 * 60 * 1000);
}

export async function generateTasksFromTrackable(trackable: {
  name: string;
  type?: string;
  category?: string;
  brand?: string;
  model?: string;
  userId?: string;
  trackableId?: string;
}) {
  console.log('🧠 Task gen input:', trackable);

  const templateTasks: TaskTemplate[] =
    (trackable.model && taskTemplates[trackable.model]) ||
    (trackable.type && taskTemplates[trackable.type]) ||
    [];

  // If we have local templates, use them
  if (templateTasks.length > 0) {
    return templateTasks.map(template => ({
      title: template.title,
      description: template.description || '',
      dueDate: calculateInitialDueDate(template.recurrenceInterval),
      status: 'PENDING' as TaskStatus,
      itemName: trackable.name,
      estimatedTimeMinutes: template.estimatedTimeMinutes ?? 30,
      estimatedCost: template.estimatedCost ?? 0,
      canBeOutsourced: template.canBeOutsourced ?? false,
      canDefer: template.canDefer ?? true,
      deferLimitDays: template.deferLimitDays ?? 7,
      recurrenceInterval: template.recurrenceInterval ?? '3 months',
      criticality: template.criticality ?? 'medium',
      icon: template.icon ?? '🧰',
      category: template.category ?? trackable.category ?? 'General',
      image: template.image ?? null,
      taskType: template.taskType ?? 'GENERAL',
      userId: trackable.userId ?? '',
      trackableId: trackable.trackableId ?? '',
    }));
  }

  // If no local templates found, call OpenAI
  console.log('📡 No local templates found — calling OpenAI for task generation...');
  const aiTemplates = await generateTasksFromOpenAI(trackable.name);

  return aiTemplates.map(template => ({
    title: template.title,
    description: template.description || '',
    dueDate: calculateInitialDueDate(template.recurrenceInterval),
    status: 'PENDING' as TaskStatus,
    itemName: trackable.name,
    estimatedTimeMinutes: template.estimatedTimeMinutes ?? 30,
    estimatedCost: template.estimatedCost ?? 0,
    canBeOutsourced: template.canBeOutsourced ?? false,
    canDefer: template.canDefer ?? true,
    deferLimitDays: template.deferLimitDays ?? 7,
    recurrenceInterval: template.recurrenceInterval ?? '3 months',
    criticality: template.criticality ?? 'medium',
    icon: '🤖',
    category: template.category ?? trackable.category ?? 'General',
    image: null,
    taskType: 'AI_GENERATED',
    userId: trackable.userId ?? '',
    trackableId: trackable.trackableId ?? '',
  }));
}
