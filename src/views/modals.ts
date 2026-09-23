import { Course, CategoryType, PresetType } from '../models/types.ts';
import { timeToMinutes, formatDuration } from '../utils/time.ts';
import {
  saveCourses,
  applyPreset,
  exportCoursesToJson,
  importCoursesFromJson
} from '../services/storage.ts';
import {
  syncCoursesToGoogleCalendar,
  cleanGoogleCalendarEvents,
  getSavedGoogleClientId
} from '../services/googleCalendar.ts';
import { exportToICS } from '../services/icsExporter.ts';

export function setupModals(
  getCoursesFn: () => Course[],
  setCoursesFn: (courses: Course[]) => void,
  onRefreshFn: () => void,
  showToastFn: (msg: string, type?: 'success' | 'error') => void
): void {
  // 1. Course Modal (Add / Edit)
  const courseModal = document.getElementById('course-modal');
  const courseForm = document.getElementById('course-form') as HTMLFormElement;

  window.openModal = (index: number = -1) => {
    const editIndexEl = document.getElementById('edit-index') as HTMLInputElement;
    const modalTitle = document.getElementById('modal-title');
    const courses = getCoursesFn();

    if (index >= 0 && courses[index]) {
      const c = courses[index];
      if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-indigo-600"></i> <span>Chỉnh sửa hoạt động</span>`;
      if (editIndexEl) editIndexEl.value = String(index);

      (document.getElementById('course-code') as HTMLInputElement).value = c.code || '';
      (document.getElementById('course-name') as HTMLInputElement).value = c.name || '';
      (document.getElementById('course-class') as HTMLInputElement).value = c.class || '';
      (document.getElementById('course-room') as HTMLInputElement).value = c.room || '';
      (document.getElementById('course-weekday') as HTMLSelectElement).value = String(c.weekday);
      (document.getElementById('course-start-time') as HTMLInputElement).value = c.start_time.slice(0, 5);
      (document.getElementById('course-end-time') as HTMLInputElement).value = c.end_time.slice(0, 5);

      const catRadio = document.querySelector(`input[name="activity-category"][value="${c.category || 'university'}"]`) as HTMLInputElement;
      if (catRadio) catRadio.checked = true;
    } else {
      if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-calendar-plus text-indigo-600"></i> <span>Thêm hoạt động mới</span>`;
      if (editIndexEl) editIndexEl.value = '-1';
      if (courseForm) courseForm.reset();
      (document.getElementById('course-start-time') as HTMLInputElement).value = '05:00';
      (document.getElementById('course-end-time') as HTMLInputElement).value = '06:00';

      const catRadio = document.querySelector('input[name="activity-category"][value="university"]') as HTMLInputElement;
      if (catRadio) catRadio.checked = true;
    }

    calculateDuration();
    if (courseModal) courseModal.classList.remove('hidden');
  };

  window.openModalWithTime = (weekday: number, hour: number) => {
    window.openModal(-1);
    const wdSelect = document.getElementById('course-weekday') as HTMLSelectElement;
    if (wdSelect) wdSelect.value = String(weekday);

    const sH = String(hour).padStart(2, '0');
    const eH = String(Math.min(hour + 1, 23)).padStart(2, '0');

    (document.getElementById('course-start-time') as HTMLInputElement).value = `${sH}:00`;
    (document.getElementById('course-end-time') as HTMLInputElement).value = `${eH}:00`;
    calculateDuration();
  };

  window.openModalForSelectedDay = () => {
    const selectedWd = (window as any).selectedWeekday || 0;
    window.openModal(-1);
    const wdSelect = document.getElementById('course-weekday') as HTMLSelectElement;
    if (wdSelect) wdSelect.value = String(selectedWd);
  };

  window.closeModal = () => {
    if (courseModal) courseModal.classList.add('hidden');
  };

  window.calculateDuration = calculateDuration;

  window.setPresetDuration = (mins: number) => {
    const sInput = document.getElementById('course-start-time') as HTMLInputElement;
    const eInput = document.getElementById('course-end-time') as HTMLInputElement;
    if (!sInput || !eInput) return;

    const sMin = timeToMinutes(sInput.value);
    const eMin = sMin + mins;
    const eH = String(Math.floor(eMin / 60) % 24).padStart(2, '0');
    const eM = String(eMin % 60).padStart(2, '0');
    eInput.value = `${eH}:${eM}`;
    calculateDuration();
  };

  window.onCategoryChange = (category: CategoryType) => {
    const codeInput = document.getElementById('course-code') as HTMLInputElement;
    const roomInput = document.getElementById('course-room') as HTMLInputElement;
    const nameInput = document.getElementById('course-name') as HTMLInputElement;

    if (category === 'healthy') {
      if (!codeInput.value) codeInput.value = 'RUN';
      if (!nameInput.value) nameInput.value = 'Chạy bộ 5km & Giãn cơ';
      if (!roomInput.value) roomInput.value = 'Công viên / Quanh nhà';
    } else if (category === 'english') {
      if (!codeInput.value) codeInput.value = 'ENG';
      if (!nameInput.value) nameInput.value = 'Học Tiếng Anh';
      if (!roomInput.value) roomInput.value = 'Ở nhà';
    } else if (category === 'code') {
      if (!codeInput.value) codeInput.value = 'CODE';
      if (!nameInput.value) nameInput.value = 'Luyện LeetCode & Thuật toán';
      if (!roomInput.value) roomInput.value = 'Ở nhà';
    } else if (category === 'project') {
      if (!codeInput.value) codeInput.value = 'PROJ';
      if (!nameInput.value) nameInput.value = 'Sprint Feature Dự án';
      if (!roomInput.value) roomInput.value = 'Ở nhà';
    } else if (category === 'life') {
      if (!codeInput.value) codeInput.value = 'LIFE';
      if (!nameInput.value) nameInput.value = 'Nấu cơm & Dọn dẹp';
      if (!roomInput.value) roomInput.value = 'Bếp nhà';
    }
  };

  window.saveCourse = (e: Event) => {
    e.preventDefault();
    const editIndex = parseInt((document.getElementById('edit-index') as HTMLInputElement).value, 10);
    const code = (document.getElementById('course-code') as HTMLInputElement).value.trim();
    const name = (document.getElementById('course-name') as HTMLInputElement).value.trim();
    const className = (document.getElementById('course-class') as HTMLInputElement).value.trim();
    const room = (document.getElementById('course-room') as HTMLInputElement).value.trim();
    const weekday = parseInt((document.getElementById('course-weekday') as HTMLSelectElement).value, 10);
    const startTime = (document.getElementById('course-start-time') as HTMLInputElement).value;
    const endTime = (document.getElementById('course-end-time') as HTMLInputElement).value;

    const checkedCat = document.querySelector('input[name="activity-category"]:checked') as HTMLInputElement;
    const category: CategoryType = (checkedCat ? checkedCat.value : 'university') as CategoryType;

    const sMin = timeToMinutes(startTime);
    const eMin = timeToMinutes(endTime);
    if (eMin <= sMin) {
      showToastFn('Giờ kết thúc phải lớn hơn giờ bắt đầu!', 'error');
      return;
    }

    const courseObj: Course = {
      code,
      name,
      class: className,
      room,
      category,
      weekday,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`
    };

    const courses = [...getCoursesFn()];
    if (editIndex >= 0 && editIndex < courses.length) {
      courses[editIndex] = courseObj;
      showToastFn(`Đã cập nhật hoạt động "${name}"!`);
    } else {
      courses.push(courseObj);
      showToastFn(`Đã thêm hoạt động "${name}"!`);
    }

    saveCourses(courses);
    setCoursesFn(courses);
    window.closeModal();
    onRefreshFn();
  };

  // 2. Preset Menu
  window.togglePresetMenu = () => {
    const menu = document.getElementById('preset-dropdown');
    if (menu) menu.classList.toggle('hidden');
  };

  window.applyPreset = async (presetType: PresetType) => {
    try {
      const currentCourses = getCoursesFn();
      const updated = await applyPreset(presetType, currentCourses);
      setCoursesFn(updated);
      onRefreshFn();
      const menu = document.getElementById('preset-dropdown');
      if (menu) menu.classList.add('hidden');
      showToastFn(`Đã áp dụng thành công mẫu lịch! Tổng số: ${updated.length} hoạt động.`);
    } catch (err: any) {
      showToastFn(err.message || 'Lỗi áp dụng mẫu lịch', 'error');
    }
  };

  // 3. Export ICS Action
  window.exportICS = () => {
    const courses = getCoursesFn();
    const sDate = (document.getElementById('start-date') as HTMLInputElement)?.value || '2026-09-01';
    const eDate = (document.getElementById('end-date') as HTMLInputElement)?.value || '2026-12-31';

    exportToICS(courses, sDate, eDate);
    showToastFn('🎉 Đã tạo và tải file thoikhoabieu.ics thành công!');
  };

  // 4. Sync Modal
  const syncModal = document.getElementById('sync-modal');
  window.openSyncModal = () => {
    if (syncModal) syncModal.classList.remove('hidden');
  };
  window.closeSyncModal = () => {
    if (syncModal) syncModal.classList.add('hidden');
  };

  window.startSyncCalendar = async () => {
    const logBox = document.getElementById('sync-log-container');
    const startBtn = document.getElementById('btn-start-sync') as HTMLButtonElement;
    if (logBox) {
      logBox.classList.remove('hidden');
      logBox.innerHTML = '<div>⏳ Đang khởi tạo đồng bộ...</div>';
    }
    if (startBtn) startBtn.disabled = true;

    const calName = (document.getElementById('sync-calendar-name') as HTMLInputElement)?.value || 'TKB & Lịch Tự Học 2026-2027';
    const sDate = (document.getElementById('start-date') as HTMLInputElement)?.value || '2026-09-01';
    const eDate = (document.getElementById('end-date') as HTMLInputElement)?.value || '2026-12-31';

    const checkedCats: CategoryType[] = [];
    document.querySelectorAll<HTMLInputElement>('input[name="sync-cat"]:checked').forEach((cb) => {
      checkedCats.push(cb.value as CategoryType);
    });

    let clientId = getSavedGoogleClientId();
    if (!clientId) {
      clientId = prompt('Nhập Google OAuth Client ID của bạn (lấy từ Google Cloud Console):') || '';
    }

    try {
      await syncCoursesToGoogleCalendar(
        getCoursesFn(),
        {
          calendarName: calName,
          startDate: sDate,
          endDate: eDate,
          categories: checkedCats,
          clientId
        },
        (msg) => {
          if (logBox) {
            const line = document.createElement('div');
            line.innerText = msg;
            logBox.appendChild(line);
            logBox.scrollTop = logBox.scrollHeight;
          }
        }
      );
      showToastFn('Đồng bộ thành công lên Google Calendar!');
    } catch (err: any) {
      if (logBox) {
        const line = document.createElement('div');
        line.className = 'text-rose-400 font-bold';
        line.innerText = `❌ ${err.message}`;
        logBox.appendChild(line);
      }
      showToastFn(err.message, 'error');
    } finally {
      if (startBtn) startBtn.disabled = false;
    }
  };

  // 5. Clean Modal
  const cleanModal = document.getElementById('clean-modal');
  window.openCleanModal = () => {
    if (cleanModal) cleanModal.classList.remove('hidden');
  };
  window.closeCleanModal = () => {
    if (cleanModal) cleanModal.classList.add('hidden');
  };

  window.startCleanCalendar = async () => {
    const logBox = document.getElementById('clean-log-container');
    const startBtn = document.getElementById('btn-start-clean') as HTMLButtonElement;
    if (logBox) {
      logBox.classList.remove('hidden');
      logBox.innerHTML = '<div>⏳ Đang khởi tạo dọn dẹp...</div>';
    }
    if (startBtn) startBtn.disabled = true;

    const calName = (document.getElementById('clean-calendar-name') as HTMLInputElement)?.value || 'primary';
    const modeRadio = document.querySelector('input[name="clean-mode"]:checked') as HTMLInputElement;
    const mode = (modeRadio?.value || 'duplicates') as 'duplicates' | 'all';

    const courseCodes = Array.from(new Set(getCoursesFn().map((c) => c.code)));

    let clientId = getSavedGoogleClientId();
    if (!clientId) {
      clientId = prompt('Nhập Google OAuth Client ID của bạn:') || '';
    }

    try {
      await cleanGoogleCalendarEvents(
        courseCodes,
        { calendarName: calName, mode, clientId },
        (msg) => {
          if (logBox) {
            const line = document.createElement('div');
            line.innerText = msg;
            logBox.appendChild(line);
            logBox.scrollTop = logBox.scrollHeight;
          }
        }
      );
      showToastFn('Dọn dẹp Google Calendar thành công!');
    } catch (err: any) {
      if (logBox) {
        const line = document.createElement('div');
        line.className = 'text-rose-400 font-bold';
        line.innerText = `❌ ${err.message}`;
        logBox.appendChild(line);
      }
      showToastFn(err.message, 'error');
    } finally {
      if (startBtn) startBtn.disabled = false;
    }
  };

  // 6. JSON Backup / Export / Import handlers
  window.exportJSON = () => {
    exportCoursesToJson(getCoursesFn());
    showToastFn('Đã xuất file courses_backup.json!');
  };

  window.importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const imported = await importCoursesFromJson(file);
          setCoursesFn(imported);
          onRefreshFn();
          showToastFn(`🎉 Đã khôi phục thành công ${imported.length} hoạt động từ file!`);
        } catch (err: any) {
          showToastFn(err.message || 'Lỗi nạp file JSON', 'error');
        }
      }
    };
    input.click();
  };
}

function calculateDuration(): void {
  const sInput = document.getElementById('course-start-time') as HTMLInputElement;
  const eInput = document.getElementById('course-end-time') as HTMLInputElement;
  const badge = document.getElementById('duration-badge');
  if (!sInput || !eInput || !badge) return;

  const sMin = timeToMinutes(sInput.value);
  const eMin = timeToMinutes(eInput.value);
  const diff = eMin - sMin;

  if (diff <= 0) {
    badge.innerText = 'Thời gian không hợp lệ';
    badge.className = 'text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800';
  } else {
    badge.innerText = `Thời lượng: ${formatDuration(diff)}`;
    badge.className = 'text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800';
  }
}

declare global {
  interface Window {
    openModal: (index?: number) => void;
    openModalWithTime: (weekday: number, hour: number) => void;
    openModalForSelectedDay: () => void;
    closeModal: () => void;
    calculateDuration: () => void;
    setPresetDuration: (mins: number) => void;
    onCategoryChange: (cat: CategoryType) => void;
    saveCourse: (e: Event) => void;
    togglePresetMenu: () => void;
    applyPreset: (preset: PresetType) => void;
    exportICS: () => void;
    openSyncModal: () => void;
    closeSyncModal: () => void;
    startSyncCalendar: () => void;
    openCleanModal: () => void;
    closeCleanModal: () => void;
    startCleanCalendar: () => void;
    exportJSON: () => void;
    importJSON: () => void;
    selectedWeekday: number;
  }
}
