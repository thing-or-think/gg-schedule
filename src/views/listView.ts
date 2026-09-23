import { Course, CategoryType } from '../models/types.ts';
import { CATEGORY_META, WEEKDAY_NAMES } from '../constants/config.ts';
import { timeToMinutes, formatDuration } from '../utils/time.ts';
import { isTaskCompleted, toggleTaskComplete } from '../services/completion.ts';

export function renderListView(
  courses: Course[],
  currentFilter: CategoryType | 'all',
  onOpenEditModalFn: (index: number) => void,
  onDeleteCourseFn: (index: number) => void,
  onRefreshFn: () => void,
  showToastFn: (msg: string, type?: 'success' | 'error') => void
): void {
  const tbody = document.getElementById('list-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  let filtered = courses.map((c, originalIndex) => ({ c, originalIndex }));
  if (currentFilter !== 'all') {
    filtered = filtered.filter((item) => item.c.category === currentFilter);
  }

  // Sắp xếp theo Thứ -> Giờ bắt đầu
  filtered.sort((a, b) => {
    if (a.c.weekday !== b.c.weekday) return a.c.weekday - b.c.weekday;
    return timeToMinutes(a.c.start_time) - timeToMinutes(b.c.start_time);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="py-8 text-center text-slate-400">
          Không có hoạt động nào phù hợp với bộ lọc hiện tại.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(({ c, originalIndex }) => {
    const sMin = timeToMinutes(c.start_time);
    const eMin = timeToMinutes(c.end_time);
    const dur = Math.max(eMin - sMin, 0);

    const cat = c.category || 'university';
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;
    const isDone = isTaskCompleted(c);

    const tr = document.createElement('tr');
    tr.className = `hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
      isDone ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
    }`;

    tr.innerHTML = `
      <td class="py-3 px-3 text-center">
        <button class="btn-check-list w-6 h-6 rounded-lg border flex items-center justify-center transition ${
          isDone
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : 'border-slate-300 dark:border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-500'
        }">
          <i class="fa-solid fa-check text-[10px] ${isDone ? '' : 'opacity-0 hover:opacity-100'}"></i>
        </button>
      </td>
      <td class="py-3 px-4">
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.badge}">
          ${meta.emoji} ${meta.name}
        </span>
      </td>
      <td class="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
        ${c.code}
      </td>
      <td class="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 ${isDone ? 'line-through text-slate-400' : ''}">
        ${c.name}
      </td>
      <td class="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
        ${c.class || '—'}
      </td>
      <td class="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
        ${WEEKDAY_NAMES[c.weekday]}
      </td>
      <td class="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
        ${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}
      </td>
      <td class="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
        ${formatDuration(dur)}
      </td>
      <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
        <i class="fa-solid fa-location-dot text-slate-400 mr-1 text-[10px]"></i>${c.room || 'Ở nhà'}
      </td>
      <td class="py-3 px-4 text-right space-x-1">
        <button class="btn-edit p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Sửa">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="btn-delete p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Xóa">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;

    const checkBtn = tr.querySelector('.btn-check-list') as HTMLElement;
    if (checkBtn) {
      checkBtn.onclick = () => {
        toggleTaskComplete(c, undefined, 0, onRefreshFn, showToastFn);
      };
    }

    const editBtn = tr.querySelector('.btn-edit') as HTMLElement;
    if (editBtn) {
      editBtn.onclick = () => onOpenEditModalFn(originalIndex);
    }

    const deleteBtn = tr.querySelector('.btn-delete') as HTMLElement;
    if (deleteBtn) {
      deleteBtn.onclick = () => onDeleteCourseFn(originalIndex);
    }

    tbody.appendChild(tr);
  });
}
