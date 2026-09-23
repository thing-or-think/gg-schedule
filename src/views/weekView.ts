import { Course, CategoryType } from '../models/types.ts';
import { START_HOUR, END_HOUR, HOUR_HEIGHT, CATEGORY_META, WEEKDAY_NAMES } from '../constants/config.ts';
import {
  getWeekDates,
  getTodayDateStr,
  timeToMinutes,
  formatDuration
} from '../utils/time.ts';
import { isTaskCompleted } from '../services/completion.ts';

export function getWeekRangeLabel(weekOffset: number): string {
  const weekDays = getWeekDates(weekOffset);
  const start = weekDays[0];
  const end = weekDays[6];

  const sDay = String(start.date.getDate()).padStart(2, '0');
  const sMonth = String(start.date.getMonth() + 1).padStart(2, '0');
  const eDay = String(end.date.getDate()).padStart(2, '0');
  const eMonth = String(end.date.getMonth() + 1).padStart(2, '0');
  const year = end.date.getFullYear();

  if (weekOffset === 0) {
    return `Tuần này (${sDay}/${sMonth} – ${eDay}/${eMonth}/${year})`;
  } else if (weekOffset === 1) {
    return `Tuần sau (${sDay}/${sMonth} – ${eDay}/${eMonth}/${year})`;
  } else if (weekOffset === -1) {
    return `Tuần trước (${sDay}/${sMonth} – ${eDay}/${eMonth}/${year})`;
  } else {
    return `${sDay}/${sMonth} – ${eDay}/${eMonth}/${year}`;
  }
}

export function buildTimelineBackground(
  openModalWithTimeFn: (wd: number, hour: number) => void
): void {
  const hoursCol = document.getElementById('timeline-hours-col');
  if (!hoursCol) return;
  hoursCol.innerHTML = '';

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const timeStr = `${h.toString().padStart(2, '0')}:00`;
    const div = document.createElement('div');
    div.className =
      'time-slot-row flex items-start justify-center pt-1 text-[11px] text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800';
    div.innerText = timeStr;
    hoursCol.appendChild(div);
  }

  for (let wd = 0; wd < 7; wd++) {
    const dayCol = document.getElementById(`col-day-${wd}`);
    if (!dayCol) continue;
    dayCol.innerHTML = '';

    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const slot = document.createElement('div');
      slot.className =
        'time-slot-row border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors';
      slot.title = `Bấm để thêm hoạt động vào ${WEEKDAY_NAMES[wd]} lúc ${h.toString().padStart(2, '0')}:00`;
      slot.onclick = () => openModalWithTimeFn(wd, h);
      dayCol.appendChild(slot);
    }
  }
}

export function renderTimelineEvents(
  courses: Course[],
  weekOffset: number,
  currentFilter: CategoryType | 'all',
  onZoomIntoDayFn: (wd: number, offset: number) => void,
  onOpenEditModalFn: (index: number) => void
): void {
  const titleDisplay = document.getElementById('week-title-display');
  if (titleDisplay) {
    titleDisplay.innerText = getWeekRangeLabel(weekOffset);
  }

  const weekDays = getWeekDates(weekOffset);
  const todayStr = getTodayDateStr();

  const daySubtitles = [
    'Ở lại trường cả ngày',
    'Mạng MT (07h-09h40)',
    'Tự học 100% • Bài lớn',
    'Thu thập YC (10h-12h40)',
    'AI & CSDL (2 ca học)',
    'Tự học & Portfolio',
    'Review tuần & LeetCode'
  ];

  weekDays.forEach((dayInfo, wd) => {
    const headerEl = document.getElementById(`col-header-day-${wd}`);
    if (!headerEl) return;

    const isToday = dayInfo.dateStr === todayStr;

    headerEl.onclick = () => onZoomIntoDayFn(wd, weekOffset);
    headerEl.title = `Xem chi tiết ${WEEKDAY_NAMES[wd]} (${dayInfo.displayDate})`;

    headerEl.className = `py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-700 flex flex-col items-center cursor-pointer transition ${
      isToday
        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/80 z-10'
        : wd === 5 || wd === 6
        ? 'bg-rose-50/20 dark:bg-rose-950/20 hover:bg-rose-50/40 dark:hover:bg-rose-900/30'
        : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
    }`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="${isToday ? 'text-indigo-600 dark:text-indigo-400 font-black' : wd === 6 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-800 dark:text-slate-200 font-extrabold'}">
          ${WEEKDAY_NAMES[wd]}
        </span>
        ${isToday ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>' : ''}
      </div>
      <div class="text-[10px] font-mono ${isToday ? 'text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-500 dark:text-slate-400'}">
        ${dayInfo.displayDate}
      </div>
      <div class="text-[9px] text-slate-400 dark:text-slate-500 font-normal truncate max-w-full hidden xl:block mt-0.5">
        ${daySubtitles[wd] || ''}
      </div>
    `;
  });

  // Render cards in 7 columns
  for (let wd = 0; wd < 7; wd++) {
    const dayCol = document.getElementById(`col-day-${wd}`);
    if (!dayCol) continue;

    const existingCards = dayCol.querySelectorAll('.timeline-event-card');
    existingCards.forEach((c) => c.remove());

    const dayInfo = weekDays[wd];
    let dayCourses = courses.filter((c) => c.weekday === wd);
    if (currentFilter !== 'all') {
      dayCourses = dayCourses.filter((c) => c.category === currentFilter);
    }

    dayCourses.forEach((c) => {
      const sMin = timeToMinutes(c.start_time);
      const eMin = timeToMinutes(c.end_time);
      const dur = Math.max(eMin - sMin, 0);

      const topPx = (sMin / 60 - START_HOUR) * HOUR_HEIGHT;
      const heightPx = Math.max((dur / 60) * HOUR_HEIGHT - 2, 26);

      const cat = c.category || 'university';
      const meta = CATEGORY_META[cat] || CATEGORY_META.university;
      const isDone = isTaskCompleted(c, dayInfo.dateStr, weekOffset);

      const card = document.createElement('div');
      card.className = `timeline-event-card absolute left-1 right-1 rounded-lg p-1.5 shadow-2xs border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
        meta.bg
      } ${meta.cardBorder} ${isDone ? 'opacity-50 ring-1 ring-emerald-500' : 'hover:scale-[1.02] hover:z-20'}`;
      card.style.top = `${topPx}px`;
      card.style.height = `${heightPx}px`;

      card.innerHTML = `
        <div class="leading-tight">
          <div class="text-[10px] font-bold truncate flex items-center gap-1">
            <span>${meta.emoji}</span>
            <span class="truncate">${c.code}: ${c.name}</span>
          </div>
          <div class="text-[9px] font-mono opacity-80">${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}</div>
        </div>
        ${
          heightPx > 40
            ? `<div class="text-[9px] opacity-75 truncate flex items-center justify-between">
                <span class="truncate">${c.room || 'Ở nhà'}</span>
                <span class="font-mono text-[8.5px]">${formatDuration(dur)}</span>
              </div>`
            : ''
        }
      `;

      card.onclick = (e) => {
        e.stopPropagation();
        const originalIdx = courses.indexOf(c);
        if (originalIdx !== -1) onOpenEditModalFn(originalIdx);
      };

      dayCol.appendChild(card);
    });
  }
}
