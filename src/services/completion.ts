import { Course, EvalMode, CategoryType } from '../models/types.ts';
import {
  getTodayDateStr,
  getTodayWeekday,
  timeToMinutes,
  formatDuration,
  formatMinutesToTime,
  getWeekDates,
  getWeekdayName
} from '../utils/time.ts';

export function getTaskKey(c: Course): string {
  const sTime = (c.start_time || '00:00').slice(0, 5);
  const code = (c.code || 'ACT').trim();
  return `task_wd${c.weekday}_${sTime}_${code}`;
}

export function getCompletionStorageKey(dateStr?: string): string {
  const ds = dateStr || getTodayDateStr();
  return `gg_cal_completed_${ds}`;
}

export function getCompletedTasksSet(dateStr?: string): Set<string> {
  const key = getCompletionStorageKey(dateStr);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveCompletedTasksSet(completedSet: Set<string>, dateStr?: string): void {
  const key = getCompletionStorageKey(dateStr);
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(completedSet)));
  } catch (e) {
    console.error('Lỗi lưu trạng thái hoàn thành:', e);
  }
}

export function isTaskCompleted(c: Course, dateStr?: string, weekOffset: number = 0): boolean {
  let targetDate = dateStr;
  if (!targetDate) {
    const weekDays = getWeekDates(weekOffset);
    if (weekDays && weekDays[c.weekday]) {
      targetDate = weekDays[c.weekday].dateStr;
    } else {
      targetDate = getTodayDateStr();
    }
  }
  const set = getCompletedTasksSet(targetDate);
  return set.has(getTaskKey(c));
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  status: 'valid' | 'too_early' | 'too_late' | 'wrong_day';
  windowStartStr: string;
  windowEndStr: string;
}

export function validateTaskCheckWindow(c: Course, dateStr?: string, weekOffset: number = 0): ValidationResult {
  const now = new Date();
  const todayStr = getTodayDateStr();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMin = currentHour * 60 + currentMinute;
  const todayWd = getTodayWeekday();

  let targetDate = dateStr;
  if (!targetDate) {
    const weekDays = getWeekDates(weekOffset);
    if (weekDays && weekDays[c.weekday]) {
      targetDate = weekDays[c.weekday].dateStr;
    } else {
      targetDate = todayStr;
    }
  }

  const startMin = timeToMinutes(c.start_time);
  const endMin = timeToMinutes(c.end_time);

  const windowStartMin = Math.max(startMin - 120, 0); // 2 tiếng trước khi bắt đầu
  const windowEndMin = Math.min(endMin + 120, 24 * 60); // 2 tiếng sau khi kết thúc

  const windowStartStr = formatMinutesToTime(windowStartMin);
  const windowEndStr = formatMinutesToTime(windowEndMin);

  // 1. Phải là ngày hôm nay
  if (targetDate !== todayStr) {
    if (targetDate < todayStr) {
      return {
        isValid: false,
        reason: `⛔ Đã quá hạn điểm danh! Ngày ${targetDate} đã trôi qua. Không thể điểm danh bù để chống tích ảo!`,
        status: 'too_late',
        windowStartStr,
        windowEndStr
      };
    } else {
      return {
        isValid: false,
        reason: `⏳ Chưa đến ngày điểm danh! Hoạt động này diễn ra vào ${targetDate}. Vui lòng quay lại vào đúng ngày!`,
        status: 'too_early',
        windowStartStr,
        windowEndStr
      };
    }
  }

  // 2. Thứ trong tuần phải trùng hôm nay
  if (c.weekday !== todayWd) {
    return {
      isValid: false,
      reason: `⚠️ Không thể tích! Hoạt động này thuộc ${getWeekdayName(c.weekday)}, hôm nay là ${getWeekdayName(todayWd)}. Chỉ được điểm danh đúng ngày diễn ra!`,
      status: 'wrong_day',
      windowStartStr,
      windowEndStr
    };
  }

  // 3. Khung giờ trong vòng 2 tiếng
  if (currentMin < windowStartMin) {
    const diffMins = windowStartMin - currentMin;
    return {
      isValid: false,
      reason: `⏳ Chưa đến khung giờ điểm danh! Chỉ được tích trong vòng 2 tiếng quanh hoạt động (từ ${windowStartStr} đến ${windowEndStr}). Vui lòng quay lại sau ${formatDuration(diffMins)}!`,
      status: 'too_early',
      windowStartStr,
      windowEndStr
    };
  }

  if (currentMin > windowEndMin) {
    return {
      isValid: false,
      reason: `⛔ Đã quá hạn điểm danh! Hoạt động "${c.name}" đã kết thúc quá 2 tiếng (hạn chót lúc ${windowEndStr}). Không thể tích để tránh tích ảo!`,
      status: 'too_late',
      windowStartStr,
      windowEndStr
    };
  }

  return {
    isValid: true,
    status: 'valid',
    windowStartStr,
    windowEndStr
  };
}

export function toggleTaskComplete(
  c: Course,
  dateStr?: string,
  weekOffset: number = 0,
  onUpdate?: () => void,
  showToast?: (msg: string, type?: 'success' | 'error') => void
): void {
  let ds = dateStr;
  if (!ds) {
    const weekDays = getWeekDates(weekOffset);
    if (weekDays && weekDays[c.weekday]) {
      ds = weekDays[c.weekday].dateStr;
    } else {
      ds = getTodayDateStr();
    }
  }

  const set = getCompletedTasksSet(ds);
  const taskKey = getTaskKey(c);
  const wasCompleted = set.has(taskKey);

  if (!wasCompleted) {
    const validation = validateTaskCheckWindow(c, ds, weekOffset);
    if (!validation.isValid) {
      if (showToast) showToast(validation.reason || 'Không hợp lệ', 'error');
      return;
    }
    set.add(taskKey);
  } else {
    set.delete(taskKey);
  }

  saveCompletedTasksSet(set, ds);

  if (onUpdate) onUpdate();

  if (showToast) {
    if (!wasCompleted) {
      showToast(`🎉 Đã hoàn thành: "${c.name}" (${ds})!`, 'success');
    } else {
      showToast(`↩ Đã bỏ đánh dấu: "${c.name}" (${ds})`, 'success');
    }
  }
}

export function resetTodayCompletions(
  selectedWeekday: number = 0,
  weekOffset: number = 0,
  onUpdate?: () => void,
  showToast?: (msg: string) => void
): void {
  const weekDays = getWeekDates(weekOffset);
  const ds = weekDays && weekDays[selectedWeekday] ? weekDays[selectedWeekday].dateStr : getTodayDateStr();

  if (confirm(`Bạn có muốn đặt lại (reset) toàn bộ trạng thái hoàn thành của ngày ${ds}?`)) {
    localStorage.removeItem(getCompletionStorageKey(ds));
    if (onUpdate) onUpdate();
    if (showToast) showToast(`✨ Đã đặt lại toàn bộ tiến độ ngày ${ds}!`);
  }
}

export function calculateDailyProductivity(
  courses: Course[],
  weekday?: number,
  dateStr?: string,
  weekOffset: number = 0
) {
  const currentWd = weekday !== undefined ? weekday : getTodayWeekday();

  let ds = dateStr;
  if (!ds) {
    const weekDays = getWeekDates(weekOffset);
    if (weekDays && weekDays[currentWd]) {
      ds = weekDays[currentWd].dateStr;
    } else {
      ds = getTodayDateStr();
    }
  }

  const dayCourses = courses.filter((c) => c.weekday === currentWd);
  const completedSet = getCompletedTasksSet(ds);

  const totalTasks = dayCourses.length;
  let completedTasks = 0;
  let totalPlannedMins = 0;
  let completedMins = 0;

  const catMins: Record<CategoryType, { total: number; completed: number }> = {
    university: { total: 0, completed: 0 },
    healthy: { total: 0, completed: 0 },
    english: { total: 0, completed: 0 },
    code: { total: 0, completed: 0 },
    project: { total: 0, completed: 0 },
    life: { total: 0, completed: 0 },
    leisure: { total: 0, completed: 0 }
  };

  dayCourses.forEach((c) => {
    const s = timeToMinutes(c.start_time);
    const e = timeToMinutes(c.end_time);
    const dur = Math.max(e - s, 0);
    totalPlannedMins += dur;

    const cat = c.category || 'university';
    if (catMins[cat]) catMins[cat].total += dur;

    const isDone = completedSet.has(getTaskKey(c));
    if (isDone) {
      completedTasks++;
      completedMins += dur;
      if (catMins[cat]) catMins[cat].completed += dur;
    }
  });

  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let rating = {
    label: 'Cần tăng tốc 💪',
    color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    desc: 'Hãy tập trung thực hiện các hoạt động kế tiếp nhé!'
  };

  if (percent === 100 && totalTasks > 0) {
    rating = {
      label: 'Xuất sắc 🔥 100%',
      color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800',
      desc: 'Tuyệt đỉnh! Bạn đã hoàn thành toàn bộ mục tiêu ngày này!'
    };
  } else if (percent >= 80) {
    rating = {
      label: 'Rất tốt 🌟',
      color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800',
      desc: 'Năng suất rất cao, giữ vững phong độ này nhé!'
    };
  } else if (percent >= 50) {
    rating = {
      label: 'Đang tiến bộ ⚡',
      color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800',
      desc: 'Tích cực! Đang đi đúng hướng, hoàn thành các mục còn lại nào!'
    };
  }

  return {
    dateStr: ds,
    weekday: currentWd,
    totalTasks,
    completedTasks,
    percent,
    totalPlannedMins,
    completedMins,
    catMins,
    rating
  };
}

export function renderProductivityUI(
  courses: Course[],
  evalMode: EvalMode = 'day',
  selectedWeekday: number = 0,
  weekOffset: number = 0
): void {
  const container = document.getElementById('evaluation-content-container');
  if (!container) return;

  const stats = calculateDailyProductivity(courses, selectedWeekday, undefined, weekOffset);

  const dayBtn = document.getElementById('eval-tab-day');
  const weekBtn = document.getElementById('eval-tab-week');
  const monthBtn = document.getElementById('eval-tab-month');

  const activeClass = 'px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs transition';
  const inactiveClass = 'px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition';

  if (dayBtn) dayBtn.className = evalMode === 'day' ? activeClass : inactiveClass;
  if (weekBtn) weekBtn.className = evalMode === 'week' ? activeClass : inactiveClass;
  if (monthBtn) monthBtn.className = evalMode === 'month' ? activeClass : inactiveClass;

  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-2xl font-black text-slate-900 dark:text-white font-mono">${stats.percent}%</span>
          <div>
            <div class="text-[11px] font-bold ${stats.rating.color} px-2 py-0.5 rounded-md inline-block">${stats.rating.label}</div>
            <div class="text-[10px] text-slate-400 dark:text-slate-500">${stats.completedTasks}/${stats.totalTasks} hoạt động • ${formatDuration(stats.completedMins)} / ${formatDuration(stats.totalPlannedMins)}</div>
          </div>
        </div>
      </div>
      <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-300" style="width: ${stats.percent}%"></div>
      </div>
    </div>
  `;
}
