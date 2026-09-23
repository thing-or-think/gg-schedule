import { Course, CategoryType } from '../models/types.ts';
import { CATEGORY_META, MONTH_NAMES } from '../constants/config.ts';
import { getTodayDateStr } from '../utils/time.ts';
import { isTaskCompleted } from '../services/completion.ts';

export function renderMonthView(
  courses: Course[],
  currentMonth: number,
  currentYear: number,
  currentFilter: CategoryType | 'all',
  onZoomIntoDateFn: (year: number, month: number, day: number, wd: number) => void
): void {
  const monthTitle = document.getElementById('month-title-display');
  if (monthTitle) {
    monthTitle.innerText = `${MONTH_NAMES[currentMonth]} / ${currentYear}`;
  }

  // Update quick buttons
  [8, 9, 10, 11].forEach((m) => {
    const btn = document.getElementById(`btn-month-${m}`);
    if (btn) {
      if (m === currentMonth && currentYear === 2026) {
        btn.className =
          'month-quick-btn px-2.5 py-1 text-xs font-bold rounded-lg transition bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs';
      } else {
        btn.className =
          'month-quick-btn px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-lg hover:text-slate-900 dark:hover:text-white transition';
      }
    }
  });

  const gridCells = document.getElementById('month-grid-cells');
  if (!gridCells) return;
  gridCells.innerHTML = '';

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // 0=Monday, 6=Sunday
  const totalDays = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  const todayStr = getTodayDateStr();

  // 1. Previous month trailing cells
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDay = prevMonthLastDay - i;
    const cell = document.createElement('div');
    cell.className = 'min-h-[110px] p-2 bg-slate-50/50 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 select-none';
    cell.innerHTML = `<span class="text-xs font-bold font-mono opacity-50">${prevDay}</span>`;
    gridCells.appendChild(cell);
  }

  // 2. Current month cells
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const wd = d.getDay() === 0 ? 6 : d.getDay() - 1;

    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${mm}-${dd}`;
    const isToday = dateStr === todayStr;

    let dayCourses = courses.filter((c) => c.weekday === wd);
    if (currentFilter !== 'all') {
      dayCourses = dayCourses.filter((c) => c.category === currentFilter);
    }

    const cell = document.createElement('div');
    cell.className = `min-h-[110px] p-2 flex flex-col justify-between transition cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 ${
      isToday
        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/80'
        : wd === 5 || wd === 6
        ? 'bg-rose-50/10 dark:bg-rose-950/10'
        : 'bg-white dark:bg-slate-900'
    }`;

    let completedCount = 0;
    dayCourses.forEach((c) => {
      if (isTaskCompleted(c, dateStr)) completedCount++;
    });

    const maxShown = 3;
    const shownCourses = dayCourses.slice(0, maxShown);
    const extraCount = dayCourses.length - maxShown;

    const coursesHtml = shownCourses
      .map((c) => {
        const cat = c.category || 'university';
        const meta = CATEGORY_META[cat] || CATEGORY_META.university;
        return `
          <div class="text-[9px] truncate rounded px-1 py-0.2 font-medium ${meta.badge} leading-tight">
            ${meta.emoji} ${c.code}
          </div>
        `;
      })
      .join('');

    cell.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-mono font-black ${
            isToday
              ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center'
              : wd === 6
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-800 dark:text-slate-200'
          }">
            ${day}
          </span>
          ${
            dayCourses.length > 0
              ? `<span class="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">${completedCount}/${dayCourses.length}</span>`
              : ''
          }
        </div>
        <div class="space-y-1">
          ${coursesHtml}
          ${extraCount > 0 ? `<div class="text-[8.5px] font-bold text-slate-400 dark:text-slate-500">+${extraCount} mục nữa</div>` : ''}
        </div>
      </div>
    `;

    cell.onclick = () => {
      onZoomIntoDateFn(currentYear, currentMonth, day, wd);
    };

    gridCells.appendChild(cell);
  }

  // 3. Next month leading cells to fill 35 or 42 grid
  const totalRendered = startDayOfWeek + totalDays;
  const remaining = (7 - (totalRendered % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const cell = document.createElement('div');
    cell.className = 'min-h-[110px] p-2 bg-slate-50/50 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 select-none';
    cell.innerHTML = `<span class="text-xs font-bold font-mono opacity-50">${day}</span>`;
    gridCells.appendChild(cell);
  }
}
