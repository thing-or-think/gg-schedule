import { Course, CategoryType, ViewType, EvalMode } from './models/types.ts';
import { CATEGORY_META } from './constants/config.ts';
import { timeToMinutes, formatDuration, getTodayWeekday } from './utils/time.ts';
import { loadCourses, saveCourses } from './services/storage.ts';
import { initTheme } from './services/theme.ts';
import { initRealtimeTracker, updateRealtimeTracker } from './services/tracker.ts';
import {
  renderProductivityUI,
  toggleTaskComplete,
  resetTodayCompletions
} from './services/completion.ts';
import { buildDayTimelineBackground, renderDayView } from './views/dayView.ts';
import { buildTimelineBackground, renderTimelineEvents } from './views/weekView.ts';
import { renderMonthView } from './views/monthView.ts';
import { renderListView } from './views/listView.ts';
import { setupModals } from './views/modals.ts';

// State
let courses: Course[] = [];
let currentFilter: CategoryType | 'all' = 'all';
let currentView: ViewType = 'week';
let selectedWeekday: number = getTodayWeekday();
let currentWeekOffset: number = 0;
let currentMonth: number = new Date().getMonth();
let currentYear: number = new Date().getFullYear();
let currentEvalMode: EvalMode = 'day';

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  toast.className = `flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold text-white transition-all ${
    isSuccess ? 'bg-slate-900 dark:bg-slate-800 border-slate-800 dark:border-slate-700' : 'bg-rose-600 border-rose-500'
  }`;
  toast.innerHTML = `<i class="fa-solid ${isSuccess ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation'}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function refreshCurrentView(): void {
  updateStatsOverview();
  renderProductivityUI(courses, currentEvalMode, selectedWeekday, currentWeekOffset);

  if (currentView === 'day') {
    renderDayView(
      courses,
      selectedWeekday,
      currentWeekOffset,
      currentFilter,
      (wd) => {
        selectedWeekday = wd;
        window.selectedWeekday = wd;
        buildDayTimelineBackground(selectedWeekday, window.openModalWithTime);
        refreshCurrentView();
      },
      (idx) => window.openModal(idx),
      (wd) => {
        selectedWeekday = wd;
        window.openModalForSelectedDay();
      },
      refreshCurrentView,
      showToast
    );
  } else if (currentView === 'week') {
    renderTimelineEvents(
      courses,
      currentWeekOffset,
      currentFilter,
      (wd, offset) => {
        currentWeekOffset = offset;
        selectedWeekday = wd;
        window.selectedWeekday = wd;
        switchTab('day');
      },
      (idx) => window.openModal(idx)
    );
  } else if (currentView === 'month') {
    renderMonthView(
      courses,
      currentMonth,
      currentYear,
      currentFilter,
      (y, m, d, wd) => {
        currentYear = y;
        currentMonth = m;
        selectedWeekday = wd;
        window.selectedWeekday = wd;

        // Tính week offset tương ứng
        const targetDate = new Date(y, m, d);
        const now = new Date();
        const currentMonday = new Date(now);
        currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        currentMonday.setHours(0, 0, 0, 0);

        const targetMonday = new Date(targetDate);
        targetMonday.setDate(targetDate.getDate() - (targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1));
        targetMonday.setHours(0, 0, 0, 0);

        const diffDays = Math.round((targetMonday.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24));
        currentWeekOffset = Math.round(diffDays / 7);

        switchTab('day');
      }
    );
  } else if (currentView === 'list') {
    renderListView(
      courses,
      currentFilter,
      (idx) => window.openModal(idx),
      (idx) => {
        const item = courses[idx];
        if (confirm(`Bạn có chắc muốn xóa hoạt động "${item.name}"?`)) {
          courses.splice(idx, 1);
          saveCourses(courses);
          refreshCurrentView();
          showToast(`Đã xóa hoạt động "${item.name}"!`);
        }
      },
      refreshCurrentView,
      showToast
    );
  }

  updateRealtimeTracker(() => courses, (c) => {
    toggleTaskComplete(c, undefined, currentWeekOffset, refreshCurrentView, showToast);
  });
}

export function updateStatsOverview(): void {
  // Category counts on filter bar
  const counts: Record<string, number> = {
    all: courses.length,
    university: 0,
    healthy: 0,
    english: 0,
    code: 0,
    project: 0,
    life: 0,
    leisure: 0
  };

  const hours: Record<string, number> = {
    university: 0,
    healthy: 0,
    english: 0,
    code: 0,
    project: 0,
    life: 0,
    leisure: 0
  };

  let totalMinutes = 0;

  courses.forEach((c) => {
    const cat = c.category || 'university';
    if (counts[cat] !== undefined) counts[cat]++;
    const dur = Math.max(timeToMinutes(c.end_time) - timeToMinutes(c.start_time), 0);
    totalMinutes += dur;
    if (hours[cat] !== undefined) hours[cat] += dur;
  });

  // Update filter badge counts
  Object.keys(counts).forEach((cat) => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.innerText = String(counts[cat]);
  });

  // Update total hours badge
  const totalBadge = document.getElementById('total-hours-badge');
  if (totalBadge) {
    totalBadge.innerText = `Tổng: ${formatDuration(totalMinutes)} / tuần`;
  }

  // Update stats chips container
  const statsContainer = document.getElementById('stats-container');
  if (statsContainer) {
    statsContainer.innerHTML = '';
    (Object.keys(hours) as CategoryType[]).forEach((cat) => {
      const meta = CATEGORY_META[cat];
      if (!meta) return;
      const chip = document.createElement('div');
      chip.className = `p-2 rounded-xl border flex flex-col justify-between ${meta.bg}`;
      chip.innerHTML = `
        <div class="flex items-center justify-between text-[10px] font-bold">
          <span>${meta.emoji} ${meta.name}</span>
          <span class="font-mono opacity-80">${counts[cat] || 0}</span>
        </div>
        <div class="text-xs font-black font-mono mt-1">${formatDuration(hours[cat] || 0)}</div>
      `;
      statsContainer.appendChild(chip);
    });
  }
}

export function switchTab(tab: ViewType): void {
  currentView = tab;

  const dayView = document.getElementById('view-day');
  const weekView = document.getElementById('view-week');
  const monthView = document.getElementById('view-month');
  const listView = document.getElementById('view-list');

  const dayBtn = document.getElementById('tab-day-btn');
  const weekBtn = document.getElementById('tab-week-btn');
  const monthBtn = document.getElementById('tab-month-btn');
  const listBtn = document.getElementById('tab-list-btn');

  const activeBtnClass = 'px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm transition flex items-center';
  const inactiveBtnClass = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center';

  if (dayView) dayView.classList.add('hidden');
  if (weekView) weekView.classList.add('hidden');
  if (monthView) monthView.classList.add('hidden');
  if (listView) listView.classList.add('hidden');

  if (dayBtn) dayBtn.className = inactiveBtnClass;
  if (weekBtn) weekBtn.className = inactiveBtnClass;
  if (monthBtn) monthBtn.className = inactiveBtnClass;
  if (listBtn) listBtn.className = inactiveBtnClass;

  if (tab === 'day') {
    if (dayView) dayView.classList.remove('hidden');
    if (dayBtn) dayBtn.className = activeBtnClass;
    buildDayTimelineBackground(selectedWeekday, window.openModalWithTime);
  } else if (tab === 'week') {
    if (weekView) weekView.classList.remove('hidden');
    if (weekBtn) weekBtn.className = activeBtnClass;
  } else if (tab === 'month') {
    if (monthView) monthView.classList.remove('hidden');
    if (monthBtn) monthBtn.className = activeBtnClass;
  } else if (tab === 'list') {
    if (listView) listView.classList.remove('hidden');
    if (listBtn) listBtn.className = activeBtnClass;
  }

  refreshCurrentView();
}

export function filterCategory(category: CategoryType | 'all'): void {
  currentFilter = category;
  document.querySelectorAll('.cat-filter-btn').forEach((btn) => {
    const cat = btn.getAttribute('data-cat');
    if (cat === category) {
      btn.className = 'cat-filter-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 dark:bg-indigo-600 text-white transition shadow-xs';
    } else {
      btn.className = 'cat-filter-btn px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition';
    }
  });

  refreshCurrentView();
}

// Global Bindings for HTML template handlers
declare global {
  interface Window {
    switchTab: (tab: ViewType) => void;
    filterCategory: (cat: CategoryType | 'all') => void;
    prevDay: () => void;
    nextDay: () => void;
    prevWeek: () => void;
    nextWeek: () => void;
    goToCurrentWeek: () => void;
    prevMonth: () => void;
    nextMonth: () => void;
    goToCurrentMonth: () => void;
    setMonth: (m: number) => void;
    setEvalMode: (m: EvalMode) => void;
    resetTodayCompletions: () => void;
    locateTodayOnCalendar: () => void;
  }
}

window.switchTab = switchTab;
window.filterCategory = filterCategory;
window.selectedWeekday = selectedWeekday;

window.prevDay = () => {
  if (selectedWeekday === 0) {
    selectedWeekday = 6;
    currentWeekOffset--;
  } else {
    selectedWeekday--;
  }
  window.selectedWeekday = selectedWeekday;
  buildDayTimelineBackground(selectedWeekday, window.openModalWithTime);
  refreshCurrentView();
};

window.nextDay = () => {
  if (selectedWeekday === 6) {
    selectedWeekday = 0;
    currentWeekOffset++;
  } else {
    selectedWeekday++;
  }
  window.selectedWeekday = selectedWeekday;
  buildDayTimelineBackground(selectedWeekday, window.openModalWithTime);
  refreshCurrentView();
};

window.locateTodayOnCalendar = () => {
  currentWeekOffset = 0;
  selectedWeekday = getTodayWeekday();
  window.selectedWeekday = selectedWeekday;
  buildDayTimelineBackground(selectedWeekday, window.openModalWithTime);
  refreshCurrentView();
  showToast('Đã định vị về ngày hôm nay!');
};

window.prevWeek = () => {
  currentWeekOffset--;
  refreshCurrentView();
};

window.nextWeek = () => {
  currentWeekOffset++;
  refreshCurrentView();
};

window.goToCurrentWeek = () => {
  currentWeekOffset = 0;
  refreshCurrentView();
  showToast('Đang xem tuần hiện tại');
};

window.prevMonth = () => {
  if (currentMonth === 0) {
    currentMonth = 11;
    currentYear--;
  } else {
    currentMonth--;
  }
  refreshCurrentView();
};

window.nextMonth = () => {
  if (currentMonth === 11) {
    currentMonth = 0;
    currentYear++;
  } else {
    currentMonth++;
  }
  refreshCurrentView();
};

window.goToCurrentMonth = () => {
  const now = new Date();
  currentMonth = now.getMonth();
  currentYear = now.getFullYear();
  refreshCurrentView();
};

window.setMonth = (m: number) => {
  currentMonth = m;
  currentYear = 2026;
  refreshCurrentView();
};

window.setEvalMode = (m: EvalMode) => {
  currentEvalMode = m;
  renderProductivityUI(courses, currentEvalMode, selectedWeekday, currentWeekOffset);
};

window.resetTodayCompletions = () => {
  resetTodayCompletions(selectedWeekday, currentWeekOffset, refreshCurrentView, showToast);
};

// Initial App Boot
document.addEventListener('DOMContentLoaded', async () => {
  initTheme(showToast);

  setupModals(
    () => courses,
    (updated) => { courses = updated; },
    refreshCurrentView,
    showToast
  );

  buildTimelineBackground(window.openModalWithTime);
  buildDayTimelineBackground(selectedWeekday, window.openModalWithTime);

  courses = await loadCourses();
  refreshCurrentView();

  initRealtimeTracker(() => courses, (c) => {
    toggleTaskComplete(c, undefined, currentWeekOffset, refreshCurrentView, showToast);
  });

  // Close menus on click outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('preset-dropdown');
    const btn = document.getElementById('btn-preset-menu');
    if (menu && !menu.contains(e.target as Node) && btn && !btn.contains(e.target as Node)) {
      menu.classList.add('hidden');
    }
  });
});
