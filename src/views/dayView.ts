import { Course, CategoryType } from '../models/types.ts';
import { START_HOUR, END_HOUR, HOUR_HEIGHT, DAY_THEMES, CATEGORY_META } from '../constants/config.ts';
import {
  getWeekDates,
  getTodayDateStr,
  getWeekdayName,
  timeToMinutes,
  formatDuration
} from '../utils/time.ts';
import { isTaskCompleted, toggleTaskComplete } from '../services/completion.ts';

export function buildDayTimelineBackground(
  selectedWeekday: number,
  openModalWithTimeFn: (wd: number, hour: number) => void
): void {
  const hoursCol = document.getElementById('day-timeline-hours-col');
  const eventsCol = document.getElementById('day-timeline-events-col');
  if (!hoursCol || !eventsCol) return;

  hoursCol.innerHTML = '';
  eventsCol.innerHTML = '';

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const timeStr = `${h.toString().padStart(2, '0')}:00`;
    const hourDiv = document.createElement('div');
    hourDiv.className =
      'time-slot-row flex items-start justify-center pt-1 text-[11px] text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800';
    hourDiv.innerText = timeStr;
    hoursCol.appendChild(hourDiv);

    const slot = document.createElement('div');
    slot.className =
      'time-slot-row border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors';
    slot.title = `Bấm để thêm hoạt động vào ${getWeekdayName(selectedWeekday)} lúc ${timeStr}`;
    slot.onclick = () => openModalWithTimeFn(selectedWeekday, h);
    eventsCol.appendChild(slot);
  }
}

export function renderDayView(
  courses: Course[],
  selectedWeekday: number,
  weekOffset: number,
  currentFilter: CategoryType | 'all',
  onSelectDayFn: (wd: number) => void,
  onOpenEditModalFn: (index: number) => void,
  _onOpenModalForDayFn: (wd: number) => void,
  onRefreshFn: () => void,
  showToastFn: (msg: string, type?: 'success' | 'error') => void
): void {
  const weekDays = getWeekDates(weekOffset);
  const dayInfo = weekDays[selectedWeekday];
  const todayStr = getTodayDateStr();

  // 1. Render 7-day selector pills
  const selectorContainer = document.getElementById('day-selector-pills');
  if (selectorContainer) {
    selectorContainer.innerHTML = '';
    weekDays.forEach((d, wd) => {
      const isSelected = wd === selectedWeekday;
      const isToday = d.dateStr === todayStr;

      const dayCourses = courses.filter((c) => c.weekday === wd);
      const isWeekend = wd === 5 || wd === 6;

      const pill = document.createElement('button');
      pill.onclick = () => onSelectDayFn(wd);
      pill.className = `flex-1 py-1.5 px-2 rounded-xl text-center transition flex flex-col items-center justify-center border ${
        isSelected
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black'
          : isToday
          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900'
          : isWeekend
          ? 'bg-rose-50/40 dark:bg-slate-800/80 border-rose-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`;

      pill.innerHTML = `
        <div class="text-[11px] leading-tight flex items-center gap-1">
          <span>${getWeekdayName(wd)}</span>
          ${isToday ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
        </div>
        <div class="text-[10px] opacity-80 font-mono">${d.displayDate} • ${dayCourses.length} mục</div>
      `;
      selectorContainer.appendChild(pill);
    });
  }

  // 2. Render Day Focus Theme Banner
  const themeBanner = document.getElementById('day-theme-banner');
  if (themeBanner) {
    const theme = DAY_THEMES[selectedWeekday] || DAY_THEMES[0];
    const dayCourses = courses.filter((c) => c.weekday === selectedWeekday);
    let totalMins = 0;
    dayCourses.forEach((c) => {
      totalMins += Math.max(timeToMinutes(c.end_time) - timeToMinutes(c.start_time), 0);
    });

    themeBanner.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-start space-x-3">
          <div class="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl text-indigo-300 shrink-0 mt-0.5">
            <i class="fa-solid ${theme.icon}"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-300">${getWeekdayName(selectedWeekday)}, ${dayInfo ? dayInfo.displayDate : ''}</span>
              <span class="text-[11px] text-slate-300 bg-white/10 px-2 py-0.2 rounded-full font-mono font-medium">${dayCourses.length} hoạt động • ${formatDuration(totalMins)}</span>
            </div>
            <h2 class="text-base sm:text-lg font-black text-white mt-0.5">${theme.title}</h2>
            <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">${theme.desc}</p>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Render Hourly Visual Timeline Events
  const eventsCol = document.getElementById('day-timeline-events-col');
  if (eventsCol) {
    const existingCards = eventsCol.querySelectorAll('.timeline-event-card');
    existingCards.forEach((c) => c.remove());

    let dayCourses = courses.filter((c) => c.weekday === selectedWeekday);
    if (currentFilter !== 'all') {
      dayCourses = dayCourses.filter((c) => c.category === currentFilter);
    }

    dayCourses.forEach((c) => {
      const sMin = timeToMinutes(c.start_time);
      const eMin = timeToMinutes(c.end_time);
      const dur = Math.max(eMin - sMin, 0);

      const topPx = (sMin / 60 - START_HOUR) * HOUR_HEIGHT;
      const heightPx = Math.max((dur / 60) * HOUR_HEIGHT - 2, 28);

      const cat = c.category || 'university';
      const meta = CATEGORY_META[cat] || CATEGORY_META.university;
      const isDone = isTaskCompleted(c, dayInfo ? dayInfo.dateStr : todayStr, weekOffset);

      const card = document.createElement('div');
      card.className = `timeline-event-card absolute left-2 right-2 rounded-xl p-2.5 shadow-sm border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
        meta.bg
      } ${meta.cardBorder} ${isDone ? 'opacity-50 ring-1 ring-emerald-500 line-through' : ''}`;
      card.style.top = `${topPx}px`;
      card.style.height = `${heightPx}px`;

      card.innerHTML = `
        <div class="flex items-start justify-between gap-1">
          <div class="flex items-center space-x-1.5 min-w-0">
            <span class="text-xs font-bold leading-tight truncate">${meta.emoji} [${c.code}] ${c.name}</span>
          </div>
          <span class="text-[10px] font-mono font-bold shrink-0 opacity-80">${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}</span>
        </div>
        <div class="text-[10px] opacity-75 truncate flex items-center gap-2">
          <span><i class="fa-solid fa-location-dot mr-1"></i>${c.room || 'Ở nhà'}</span>
          ${c.class ? `<span>• ${c.class}</span>` : ''}
        </div>
      `;

      card.onclick = () => {
        const originalIdx = courses.indexOf(c);
        if (originalIdx !== -1) onOpenEditModalFn(originalIdx);
      };

      eventsCol.appendChild(card);
    });
  }

  // 4. Render Chronological Detailed Agenda Stream
  const agendaStream = document.getElementById('day-agenda-stream');
  const countBadge = document.getElementById('day-agenda-count-badge');
  if (agendaStream) {
    agendaStream.innerHTML = '';

    let dayCourses = courses.filter((c) => c.weekday === selectedWeekday);
    dayCourses.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    if (countBadge) {
      countBadge.innerText = `${dayCourses.length} hoạt động`;
    }

    if (dayCourses.length === 0) {
      agendaStream.innerHTML = `
        <div class="p-8 text-center text-slate-400">
          <i class="fa-solid fa-calendar-xmark text-3xl mb-2"></i>
          <p class="text-xs">Không có hoạt động nào trong ngày này.</p>
          <button onclick="window.openModalForSelectedDay()" class="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            + Thêm hoạt động mới
          </button>
        </div>
      `;
      return;
    }

    dayCourses.forEach((c) => {
      const sMin = timeToMinutes(c.start_time);
      const eMin = timeToMinutes(c.end_time);
      const dur = Math.max(eMin - sMin, 0);

      const cat = c.category || 'university';
      const meta = CATEGORY_META[cat] || CATEGORY_META.university;
      const targetDate = dayInfo ? dayInfo.dateStr : todayStr;
      const isDone = isTaskCompleted(c, targetDate, weekOffset);

      const itemEl = document.createElement('div');
      itemEl.className = `p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
        isDone
          ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
          : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-xs'
      }`;

      itemEl.innerHTML = `
        <div class="flex items-center space-x-3 min-w-0">
          <button class="btn-check-task w-7 h-7 rounded-xl border flex items-center justify-center transition shrink-0 ${
            isDone
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-500'
          }">
            <i class="fa-solid ${isDone ? 'fa-check text-xs' : 'fa-check text-xs opacity-0 hover:opacity-100'}"></i>
          </button>

          <div class="min-w-0">
            <div class="flex items-center space-x-2">
              <span class="text-[10px] font-bold ${meta.badge} px-2 py-0.2 rounded-md">${meta.name}</span>
              <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)} (${formatDuration(dur)})</span>
            </div>
            <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate ${
              isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
            }">
              ${meta.emoji} [${c.code}] ${c.name}
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <span><i class="fa-solid fa-location-dot mr-1"></i>${c.room || 'Ở nhà'}</span>
              ${c.class ? `<span>• ${c.class}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-1 shrink-0">
          <button class="btn-edit-agenda p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Chỉnh sửa">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
        </div>
      `;

      const checkBtn = itemEl.querySelector('.btn-check-task') as HTMLElement;
      if (checkBtn) {
        checkBtn.onclick = () => {
          toggleTaskComplete(c, targetDate, weekOffset, onRefreshFn, showToastFn);
        };
      }

      const editBtn = itemEl.querySelector('.btn-edit-agenda') as HTMLElement;
      if (editBtn) {
        editBtn.onclick = () => {
          const originalIdx = courses.indexOf(c);
          if (originalIdx !== -1) onOpenEditModalFn(originalIdx);
        };
      }

      agendaStream.appendChild(itemEl);
    });
  }
}
