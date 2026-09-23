import { Course } from '../models/types.ts';
import { CATEGORY_META, START_HOUR, HOUR_HEIGHT } from '../constants/config.ts';
import {
  getTodayWeekday,
  getTodayDateStr,
  getWeekdayName,
  timeToMinutes,
  formatDuration
} from '../utils/time.ts';
import { isTaskCompleted } from './completion.ts';

let realtimeTimer: number | null = null;

export function initRealtimeTracker(
  getCoursesFn: () => Course[],
  onToggleTaskFn?: (course: Course) => void
): void {
  updateLiveClock();
  updateRealtimeTracker(getCoursesFn, onToggleTaskFn);

  if (realtimeTimer === null) {
    realtimeTimer = window.setInterval(() => {
      updateLiveClock();
      updateRealtimeTracker(getCoursesFn, onToggleTaskFn);
    }, 1000);
  }
}

export function updateLiveClock(): void {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  const clockEl = document.getElementById('live-clock-time');
  if (clockEl) {
    clockEl.innerText = `${h}:${m}:${s}`;
  }

  const dateEl = document.getElementById('live-clock-date');
  if (dateEl) {
    const todayWd = getTodayWeekday();
    const wdName = getWeekdayName(todayWd);
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    dateEl.innerText = `${wdName}, ${day}/${month}/${year}`;
  }
}

export function updateRealtimeTracker(
  getCoursesFn: () => Course[],
  onToggleTaskFn?: (course: Course) => void
): void {
  const courses = getCoursesFn();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMin = currentHour * 60 + currentMinute;
  const todayWeekday = getTodayWeekday();

  const todayCourses = courses.filter((c) => c.weekday === todayWeekday);
  todayCourses.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  let activeCourse: Course | null = null;
  let nextCourse: Course | null = null;

  for (const c of todayCourses) {
    const sMin = timeToMinutes(c.start_time);
    const eMin = timeToMinutes(c.end_time);

    if (currentMin >= sMin && currentMin < eMin) {
      activeCourse = c;
      break;
    } else if (currentMin < sMin && !nextCourse) {
      nextCourse = c;
    }
  }

  renderCurrentFocusCard(activeCourse, nextCourse, currentMin, todayWeekday, onToggleTaskFn);
  updateNowIndicatorLine(currentMin, todayWeekday);
}

export function renderCurrentFocusCard(
  activeCourse: Course | null,
  nextCourse: Course | null,
  currentMin: number,
  _todayWeekday: number,
  onToggleTaskFn?: (course: Course) => void
): void {
  const cardContainer = document.getElementById('current-focus-card');
  if (!cardContainer) return;

  if (activeCourse) {
    const eMin = timeToMinutes(activeCourse.end_time);
    const remainMins = eMin - currentMin;
    const todayStr = getTodayDateStr();
    const isDone = isTaskCompleted(activeCourse, todayStr);
    const cat = activeCourse.category || 'university';
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;

    cardContainer.innerHTML = `
      <div class="p-3.5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl border-2 border-indigo-500/80 shadow-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400/50 flex items-center justify-center text-lg text-white shrink-0 mt-0.5 shadow-md shadow-indigo-950">
            <i class="fa-solid ${meta.icon}"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                <span class="w-2 h-2 rounded-full bg-white mr-1.5 animate-ping"></span> ĐANG DIỄN RA
              </span>
              <span class="text-xs text-indigo-200 font-mono font-bold">${activeCourse.start_time.slice(0, 5)} - ${activeCourse.end_time.slice(0, 5)}</span>
              <span class="text-xs text-slate-400">• Còn ${formatDuration(remainMins)}</span>
            </div>
            <div class="text-sm sm:text-base font-black text-white mt-0.5 leading-tight">
              ${meta.emoji} [${activeCourse.code}] ${activeCourse.name}
            </div>
            <div class="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
              <span><i class="fa-solid fa-location-dot text-indigo-400 mr-1"></i>${activeCourse.room || 'Ở nhà'}</span>
              ${activeCourse.class ? `<span>• ${activeCourse.class}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button id="btn-toggle-active-focus" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            isDone
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              : 'bg-white text-indigo-900 hover:bg-slate-100 shadow-sm'
          }">
            <i class="fa-solid ${isDone ? 'fa-circle-check' : 'fa-check'}"></i>
            <span>${isDone ? 'Đã hoàn thành' : 'Đánh dấu xong'}</span>
          </button>
        </div>
      </div>
    `;

    const btn = document.getElementById('btn-toggle-active-focus');
    if (btn && onToggleTaskFn) {
      btn.onclick = () => onToggleTaskFn(activeCourse);
    }
  } else if (nextCourse) {
    const sMin = timeToMinutes(nextCourse.start_time);
    const waitMins = sMin - currentMin;
    const cat = nextCourse.category || 'university';
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;

    cardContainer.innerHTML = `
      <div class="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg text-slate-600 dark:text-slate-300 shrink-0">
            <i class="fa-solid ${meta.icon}"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <i class="fa-regular fa-clock mr-1"></i> TIẾP THEO (Sau ${formatDuration(waitMins)})
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">${nextCourse.start_time.slice(0, 5)} - ${nextCourse.end_time.slice(0, 5)}</span>
            </div>
            <div class="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              ${meta.emoji} [${nextCourse.code}] ${nextCourse.name}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">
              <i class="fa-solid fa-location-dot mr-1"></i>${nextCourse.room || 'Ở nhà'} ${nextCourse.class ? `• ${nextCourse.class}` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    cardContainer.innerHTML = `
      <div class="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
          <i class="fa-solid fa-champagne-glasses"></i>
        </div>
        <div>
          <div class="text-xs font-bold text-emerald-600 dark:text-emerald-400">ĐÃ HOÀN TẤT LỊCH HÔM NAY</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Không còn hoạt động nào trong khung giờ còn lại. Hãy thư giãn và nghỉ ngơi nhé!</div>
        </div>
      </div>
    `;
  }
}

export function updateNowIndicatorLine(currentMin: number, todayWeekday: number): void {
  const topPx = (currentMin / 60 - START_HOUR) * HOUR_HEIGHT;
  if (topPx < 0 || currentMin > 24 * 60) return;

  // Day View
  const dayCol = document.getElementById('day-timeline-events-col');
  if (dayCol) {
    let dayLine = document.getElementById('day-now-indicator');
    if (!dayLine) {
      dayLine = document.createElement('div');
      dayLine.id = 'day-now-indicator';
      dayLine.className = 'absolute left-0 right-0 z-30 pointer-events-none flex items-center';
      dayLine.innerHTML = `
        <div class="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1 shadow-sm animate-ping"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-2.5 shadow-sm"></div>
        <div class="flex-1 border-t-2 border-rose-500 border-dashed shadow-xs"></div>
        <span class="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full mr-2 shadow-xs font-mono">BÂY GIỜ</span>
      `;
      dayCol.appendChild(dayLine);
    }
    dayLine.style.top = `${topPx}px`;
  }

  // Week View
  const weekCol = document.getElementById(`col-day-${todayWeekday}`);
  if (weekCol) {
    let weekLine = document.getElementById('week-now-indicator');
    if (!weekLine) {
      weekLine = document.createElement('div');
      weekLine.id = 'week-now-indicator';
      weekLine.className = 'absolute left-0 right-0 z-30 pointer-events-none flex items-center';
      weekLine.innerHTML = `
        <div class="w-2 h-2 rounded-full bg-rose-500 -ml-1"></div>
        <div class="flex-1 border-t-2 border-rose-500 shadow-xs"></div>
      `;
      weekCol.appendChild(weekLine);
    }
    weekLine.style.top = `${topPx}px`;
  }
}
