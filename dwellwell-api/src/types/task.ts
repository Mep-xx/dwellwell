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
  dueDate: string;
  status: TaskStatus;
  completedDate?: string;
  itemName?: string;
  category?: TaskCategory;
  estimatedMinutes?: number;
  description?: string;
  steps?: string[];
  equipmentNeeded?: string[];
  resources?: { label: string; url: string }[];
  recurrence?: {
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'every_n_days';
    everyN?: number; // only if interval is 'every_n_days'
  };  
  criticality?: 'low' | 'medium' | 'high';
  deferLimitDays?: number;
  estimatedCost?: number;
  canBeOutsourced?: boolean;
  location?: string;
  imageUrl?: string;
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
  imageUrl?: string | null;
  taskType?: 'GENERAL' | 'AI_GENERATED' | 'USER_DEFINED';
};
