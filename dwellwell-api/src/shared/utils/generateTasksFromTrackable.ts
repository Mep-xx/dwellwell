// dwellwell-api/src/shared/utils/generateTasksFromTrackable.ts
import { TaskStatus } from '../types/task';
import { v4 as uuidv4 } from 'uuid';
import { taskTemplates } from '../data/mockTaskTemplates'; // adjust if you move it

export function generateTasksFromTrackable(trackable: {
    name: string;
    type?: string;
    category?: string;
    brand?: string;
    model?: string;
}) {
    const templateTasks =
        (trackable.model && taskTemplates[trackable.model]) ||
        (trackable.type && taskTemplates[trackable.type]) ||
        [];

    const today = new Date();
    const defaultOffset = 7 * 24 * 60 * 60 * 1000; // 1 week

    return templateTasks.map(template => ({
        id: uuidv4(),
        title: template.title,
        description: template.description || '',
        dueDate: new Date(today.getTime() + defaultOffset),
        status: 'PENDING' as TaskStatus,
        itemName: trackable.name,
        estimatedTimeMinutes: template.estimatedTimeMinutes || 30,
        criticality: template.criticality || 'medium',
        canDefer: template.canDefer ?? true,
        deferLimitDays: template.deferLimitDays || 7,
        estimatedCost: template.estimatedCost || 0,
        canBeOutsourced: template.canBeOutsourced ?? false,
        icon: template.icon || '🧰',
        category: template.category || trackable.category || 'General',
        imageUrl: template.imageUrl || null,
        taskType: template.taskType ?? 'GENERAL',
        trackableId: '', // to be assigned later
        userId: '',      // to be assigned later
    }));
}