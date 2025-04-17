export type TaskStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';
export type TaskCategory =
  | 'appliance'
  | 'bathroom'
  | 'cooling'
  | 'electrical'
  | 'flooring'
  | 'garage'
  | 'general'
  | 'heating'
  | 'kitchen'
  | 'outdoor'
  | 'plumbing'
  | 'safety'
  | 'windows';

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  completedDate?: string;

  itemName: string;
  category: string;
  location?: string;

  estimatedTimeMinutes: number;
  estimatedCost: number;
  criticality: 'low' | 'medium' | 'high';

  deferLimitDays: number;
  canBeOutsourced: boolean;
  canDefer: boolean;

  recurrenceInterval: string;
  taskType: 'GENERAL' | 'AI_GENERATED' | 'USER_DEFINED';

  imageUrl?: string;
  icon?: string;

  steps?: string[];
  equipmentNeeded?: string[];
  resources?: { label: string; url: string }[];
};

export type TaskTemplate = {
  title: string;
  description?: string;
  recurrenceInterval?: string;
  criticality?: 'low' | 'medium' | 'high';
  canDefer?: boolean;
  deferLimitDays?: number;
  estimatedTimeMinutes?: number;
  estimatedCost?: number;
  canBeOutsourced?: boolean;
  category?: string;
  icon?: string;
  image?: string | null;
  taskType?: 'GENERAL' | 'AI_GENERATED' | 'USER_DEFINED';
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: { label: string; url: string }[];
};
