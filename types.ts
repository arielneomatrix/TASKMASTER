
export interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  completed: boolean;
  generated?: boolean;
}

export interface UserProfile {
  name: string;
  syncCode: string;
  avatarSeed: string;
}

export interface AiTaskResponse {
  title: string;
  description: string;
  time?: string;
}

export enum ViewState {
  TASKS = 'TASKS',
  CALENDAR = 'CALENDAR',
  ASSISTANT = 'ASSISTANT',
  STATISTICS = 'STATISTICS',
  SETTINGS = 'SETTINGS'
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

export type Language = 'es' | 'en' | 'id';

