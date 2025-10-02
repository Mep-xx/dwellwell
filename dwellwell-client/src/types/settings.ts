export type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';
export type GamificationVisibility = 'PRIVATE' | 'PUBLIC' | 'HIDDEN_UI_KEEP_STATS';
export type NotificationEvent =
  | 'TASK_DUE_SOON' | 'TASK_OVERDUE' | 'WEEKLY_DIGEST'
  | 'NEW_TASKS_ADDED' | 'TRACKABLE_MILESTONE' | 'GAMIFICATION_LEVEL_UP';
export type NotificationChannel = 'EMAIL' | 'PUSH' | 'SMS';
export type NotificationFrequency = 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
export type TaskDetailView = "drawer" | "card";


export type UserSettings = {
  theme: ThemeMode;
  accentColor: string;
  fontScale: number;

  gamificationEnabled: boolean;
  gamificationVisibility: GamificationVisibility;
  retainDeletedTrackableStats: boolean;

  defaultDaysBeforeDue: number;
  autoAssignRoomTasks: boolean;
  allowTaskDisable: boolean;
  allowTaskDelete: boolean;

  taskDetailView?: TaskDetailView;

  googleCalendarEnabled: boolean;
  icalFeedToken?: string | null;
};

export type NotificationPreference = {
  event: NotificationEvent;
  channel: NotificationChannel;
  enabled: boolean;
  frequency: NotificationFrequency;
  homeId?: string | null;
  trackableId?: string | null;
};

export type SettingsBundle = {
  settings: UserSettings;
  notificationPrefs: NotificationPreference[];
  profile?: any;
  communication?: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    reminderLeadDays: number;
    quietHoursStart: number;
    quietHoursEnd: number;
  };
};
