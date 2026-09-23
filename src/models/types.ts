export type CategoryType =
  | 'university'
  | 'healthy'
  | 'english'
  | 'code'
  | 'project'
  | 'life'
  | 'leisure';

export interface Course {
  id?: string;
  code: string;
  name: string;
  class: string;
  room: string;
  category: CategoryType;
  weekday: number; // 0 = Thứ 2, 6 = Chủ nhật
  start_time: string; // "HH:MM:SS" hoặc "HH:MM"
  end_time: string; // "HH:MM:SS" hoặc "HH:MM"
}

export interface CategoryMeta {
  name: string;
  icon: string;
  bg: string;
  badge: string;
  dot: string;
  cardBorder: string;
  colorId: string;
  emoji: string;
}

export interface DayTheme {
  title: string;
  desc: string;
  icon: string;
  color: string;
}

export type PresetType =
  | 'balanced'
  | 'university'
  | 'add_english'
  | 'add_healthy'
  | 'add_code_project';

export type ViewType = 'day' | 'week' | 'month' | 'list';

export type ThemeMode = 'light' | 'dark' | 'system';

export type EvalMode = 'day' | 'week' | 'month';

export interface GoogleSyncOptions {
  calendarName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  categories: CategoryType[];
  clientId?: string;
}

export interface GoogleCleanOptions {
  calendarName: string;
  mode: 'duplicates' | 'all';
  clientId?: string;
}
