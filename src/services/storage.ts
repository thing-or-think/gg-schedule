import { Course, PresetType } from '../models/types.ts';
import { DEFAULT_UNIVERSITY_COURSES } from '../constants/config.ts';

const STORAGE_KEY = 'gg_cal_courses';
const DEFAULT_SCHEDULE_FALLBACK_URL = './default_courses.json';

let cachedDefaultSchedule: Course[] | null = null;

/**
 * Nạp danh sách lịch trình mặc định từ default_courses.json nếu có
 */
export async function getDefaultFullSchedule(): Promise<Course[]> {
  if (cachedDefaultSchedule && cachedDefaultSchedule.length > 0) {
    return cachedDefaultSchedule;
  }

  try {
    const res = await fetch(DEFAULT_SCHEDULE_FALLBACK_URL);
    if (res.ok) {
      const data: Course[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedDefaultSchedule = data;
        return data;
      }
    }
  } catch (e) {
    console.warn('Không thể nạp default_courses.json, dùng dữ liệu 6 môn học mặc định:', e);
  }

  return DEFAULT_UNIVERSITY_COURSES;
}

/**
 * Nạp danh sách môn học từ LocalStorage (hoặc khởi tạo nếu chưa có)
 */
export async function loadCourses(): Promise<Course[]> {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: Course) => ({
          ...item,
          category: item.category || 'university'
        }));
      }
    } catch (e) {
      console.error('Lỗi phân tích JSON từ LocalStorage:', e);
    }
  }

  // Khởi tạo từ default schedule
  const defaults = await getDefaultFullSchedule();
  saveCourses(defaults);
  return defaults;
}

/**
 * Lưu danh sách môn học vào LocalStorage
 */
export function saveCourses(courses: Course[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch (e) {
    console.error('Lỗi lưu vào LocalStorage:', e);
  }
}

/**
 * Áp dụng Preset gợi ý
 */
export async function applyPreset(presetType: PresetType, currentCourses: Course[]): Promise<Course[]> {
  const fullSchedule = await getDefaultFullSchedule();
  let result: Course[] = [];

  if (presetType === 'university') {
    result = DEFAULT_UNIVERSITY_COURSES;
  } else if (presetType === 'balanced') {
    result = fullSchedule;
  } else if (presetType === 'add_english') {
    const engItems = fullSchedule.filter((x) => x.category === 'english');
    const currentKeys = new Set(currentCourses.map((c) => `${c.weekday}_${c.start_time}`));
    const toAdd = engItems.filter((x) => !currentKeys.has(`${x.weekday}_${x.start_time}`));
    result = [...currentCourses, ...toAdd];
  } else if (presetType === 'add_healthy') {
    const runItems = fullSchedule.filter((x) => x.category === 'healthy' || x.category === 'life');
    const currentKeys = new Set(currentCourses.map((c) => `${c.weekday}_${c.start_time}`));
    const toAdd = runItems.filter((x) => !currentKeys.has(`${x.weekday}_${x.start_time}`));
    result = [...currentCourses, ...toAdd];
  } else if (presetType === 'add_code_project') {
    const codeItems = fullSchedule.filter((x) => x.category === 'code' || x.category === 'project');
    const currentKeys = new Set(currentCourses.map((c) => `${c.weekday}_${c.start_time}`));
    const toAdd = codeItems.filter((x) => !currentKeys.has(`${x.weekday}_${x.start_time}`));
    result = [...currentCourses, ...toAdd];
  } else {
    throw new Error('Mẫu cấu hình lịch không tồn tại.');
  }

  saveCourses(result);
  return result;
}

/**
 * Khôi phục chỉ giữ 6 môn học trường
 */
export function resetCourses(): Course[] {
  saveCourses(DEFAULT_UNIVERSITY_COURSES);
  return DEFAULT_UNIVERSITY_COURSES;
}

/**
 * Xuất dữ liệu courses ra file JSON để người dùng tải về sao lưu
 */
export function exportCoursesToJson(courses: Course[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(courses, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `courses_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Nhập dữ liệu courses từ file JSON người dùng tải lên
 */
export function importCoursesFromJson(file: File): Promise<Course[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('Định dạng file JSON không phải là mảng danh sách môn học.');
        }
        const validated: Course[] = parsed.map((item) => ({
          code: item.code || 'CODE',
          name: item.name || 'Hoạt động',
          class: item.class || '',
          room: item.room || '',
          category: item.category || 'university',
          weekday: typeof item.weekday === 'number' ? item.weekday : 0,
          start_time: item.start_time || '07:00:00',
          end_time: item.end_time || '09:00:00'
        }));
        saveCourses(validated);
        resolve(validated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file từ máy tính.'));
    reader.readAsText(file);
  });
}
