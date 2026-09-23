import { WEEKDAY_NAMES, MONTH_NAMES } from '../constants/config.ts';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
}

export function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}p`;
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayWeekday(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // 0 = Monday, 6 = Sunday
}

export function getWeekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday] || `Thứ ${weekday + 2}`;
}

export function getMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] || `Tháng ${monthIndex + 1}`;
}

export interface WeekDayInfo {
  weekday: number;
  date: Date;
  dateStr: string;
  displayDate: string;
  isToday: boolean;
}

export function getWeekDates(weekOffset: number = 0): WeekDayInfo[] {
  const now = new Date();
  const todayStr = getTodayDateStr();
  const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;

  // Monday of the target week
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayOfWeek + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const days: WeekDayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;

    days.push({
      weekday: i,
      date: d,
      dateStr,
      displayDate: `${day}/${m}`,
      isToday: dateStr === todayStr
    });
  }

  return days;
}
