export interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  completed: boolean;
  generated?: boolean;
}

export interface AiTaskResponse {
  title: string;
  description: string;
  time?: string;
}

export enum ViewState {
  TASKS = 'TASKS',
  CALENDAR = 'CALENDAR',
  ASSISTANT = 'ASSISTANT'
}

export interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasTasks: boolean;
}