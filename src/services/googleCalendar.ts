import { Course, GoogleSyncOptions, GoogleCleanOptions } from '../models/types.ts';
import { CATEGORY_META, WEEKDAY_NAMES } from '../constants/config.ts';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const GOOGLE_CLIENT_ID_STORAGE_KEY = 'gg_cal_google_client_id';

export function getSavedGoogleClientId(): string {
  return localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE_KEY) || '';
}

export function saveGoogleClientId(clientId: string): void {
  localStorage.setItem(GOOGLE_CLIENT_ID_STORAGE_KEY, clientId.trim());
}

/**
 * Yêu cầu OAuth 2.0 Access Token từ Google Identity Services
 */
export function requestGoogleAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(new Error('Google Identity Services SDK chưa được tải. Vui lòng kiểm tra kết nối mạng.'));
      return;
    }

    if (!clientId) {
      reject(new Error('Vui lòng nhập Google OAuth Client ID trước khi đồng bộ.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          resolve(response.access_token);
        },
        error_callback: (err: any) => {
          reject(new Error(err.message || 'Lỗi xác thực với Google.'));
        }
      });

      client.requestAccessToken({ prompt: '' });
    } catch (e: any) {
      reject(new Error(e.message || 'Không thể khởi tạo phiên đăng nhập Google.'));
    }
  });
}

function getFirstOccurrence(startDate: Date, targetWeekday: number): Date {
  const startDay = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
  const daysAhead = (targetWeekday - startDay + 7) % 7;
  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + daysAhead);
  return result;
}

/**
 * Tìm hoặc tạo Calendar ID theo tên
 */
async function getOrCreateCalendarId(accessToken: string, calendarName: string, onLog: (msg: string) => void): Promise<string> {
  if (calendarName.toLowerCase() === 'primary') {
    return 'primary';
  }

  // 1. Tìm trong calendarList
  const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!listRes.ok) {
    throw new Error('Không thể tải danh sách lịch từ Google.');
  }

  const listData = await listRes.json();
  const existing = (listData.items || []).find((c: any) => c.summary === calendarName);
  if (existing) {
    onLog(`📅 Đã tìm thấy lịch: "${calendarName}"`);
    return existing.id;
  }

  // 2. Tạo lịch mới
  onLog(`✨ Đang tạo lịch mới: "${calendarName}"...`);
  const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: calendarName,
      timeZone: 'Asia/Ho_Chi_Minh',
      description: 'Thời khóa biểu & Lịch tự học thông minh tạo bởi Smart Schedule Manager'
    })
  });

  if (!createRes.ok) {
    throw new Error(`Không thể tạo lịch mới: ${createRes.statusText}`);
  }

  const newCal = await createRes.json();
  onLog(`✅ Đã tạo thành công lịch: "${calendarName}"`);
  return newCal.id;
}

/**
 * Đồng bộ toàn bộ các môn học lên Google Calendar
 */
export async function syncCoursesToGoogleCalendar(
  courses: Course[],
  options: GoogleSyncOptions,
  onLog: (msg: string) => void
): Promise<void> {
  const clientId = options.clientId || getSavedGoogleClientId();
  if (!clientId) {
    throw new Error('Vui lòng nhập Google OAuth Client ID.');
  }
  saveGoogleClientId(clientId);

  onLog('🔑 Đang yêu cầu cấp quyền từ Google Account...');
  const token = await requestGoogleAccessToken(clientId);
  onLog('✅ Đã xác thực thành công tài khoản Google!');

  const calId = await getOrCreateCalendarId(token, options.calendarName, onLog);

  let targetCourses = courses;
  if (options.categories && options.categories.length > 0) {
    targetCourses = courses.filter((c) => options.categories.includes(c.category));
  }

  const startDate = new Date(options.startDate + 'T00:00:00');
  const endDate = new Date(options.endDate + 'T23:59:59');

  const untilYear = endDate.getFullYear();
  const untilMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const untilDay = String(endDate.getDate()).padStart(2, '0');
  const untilStr = `${untilYear}${untilMonth}${untilDay}T165959Z`;

  onLog(`🚀 Bắt đầu thêm ${targetCourses.length} môn học/hoạt động vào Google Calendar...`);

  for (const item of targetCourses) {
    const cat = item.category || 'university';
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;
    const emoji = meta.emoji;
    const colorId = meta.colorId || '9';

    const firstDay = getFirstOccurrence(startDate, item.weekday);
    const yyyy = firstDay.getFullYear();
    const mm = String(firstDay.getMonth() + 1).padStart(2, '0');
    const dd = String(firstDay.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const startIso = `${dateStr}T${item.start_time.slice(0, 5)}:00+07:00`;
    const endIso = `${dateStr}T${item.end_time.slice(0, 5)}:00+07:00`;
    const locationStr = cat === 'university' ? `Giảng đường ${item.room || ''}` : (item.room || 'Ở nhà');

    const eventPayload = {
      summary: `${emoji} [${item.code}] ${item.name}`,
      location: locationStr,
      description: `Hoạt động: ${item.name}\nPhân loại: ${cat.toUpperCase()}\nGhi chú: ${item.class || ''}\nĐịa điểm: ${locationStr}`,
      colorId: colorId,
      start: {
        dateTime: startIso,
        timeZone: 'Asia/Ho_Chi_Minh'
      },
      end: {
        dateTime: endIso,
        timeZone: 'Asia/Ho_Chi_Minh'
      },
      recurrence: [`RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 15 }]
      }
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (res.ok) {
      onLog(`  ✅ [${WEEKDAY_NAMES[item.weekday]}] ${emoji} ${item.name} -> Đã tạo!`);
    } else {
      const errData = await res.json().catch(() => ({}));
      onLog(`  ❌ Lỗi tạo [${item.name}]: ${errData.error?.message || res.statusText}`);
    }
  }

  onLog(`🎉 Hoàn tất đồng bộ lên Google Calendar!`);
}

/**
 * Dọn dẹp sự kiện trùng hoặc xóa toàn bộ lịch
 */
export async function cleanGoogleCalendarEvents(
  courseCodes: string[],
  options: GoogleCleanOptions,
  onLog: (msg: string) => void
): Promise<void> {
  const clientId = options.clientId || getSavedGoogleClientId();
  if (!clientId) {
    throw new Error('Vui lòng nhập Google OAuth Client ID.');
  }

  onLog('🔑 Đang yêu cầu xác thực...');
  const token = await requestGoogleAccessToken(clientId);
  onLog('✅ Xác thực tài khoản Google thành công!');

  const calId = await getOrCreateCalendarId(token, options.calendarName, onLog);

  onLog('🔍 Đang tìm kiếm các sự kiện trên lịch...');
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?maxResults=2500&singleEvents=false`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error('Không thể lấy danh sách sự kiện từ Google Calendar.');
  }

  const data = await res.json();
  const items = data.items || [];

  const matchedGroups: Record<string, any[]> = {};
  for (const ev of items) {
    const summary = ev.summary || '';
    const isMatched =
      courseCodes.some((code) => summary.includes(`[${code}]`)) ||
      ['🏫', '🇬🇧', '💻', '🚀', '🏃', '🍳', '🎮'].some((emoji) => summary.includes(emoji));

    if (isMatched) {
      if (!matchedGroups[summary]) {
        matchedGroups[summary] = [];
      }
      matchedGroups[summary].push(ev);
    }
  }

  if (Object.keys(matchedGroups).length === 0) {
    onLog('✔ Không tìm thấy sự kiện nào cần xử lý.');
    return;
  }

  let deletedCount = 0;
  for (const [summary, evList] of Object.entries(matchedGroups)) {
    const toDelete = options.mode === 'duplicates' ? evList.slice(1) : evList;

    if (options.mode === 'duplicates' && toDelete.length === 0) {
      onLog(`  ✔ [${summary}]: Chỉ có 1 bản, không trùng.`);
      continue;
    }

    for (const ev of toDelete) {
      const delRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(ev.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (delRes.ok || delRes.status === 204) {
        deletedCount++;
        onLog(`  🗑️ Đã xóa: [${summary}] (ID: ${ev.id.slice(0, 8)}...)`);
      }
    }
  }

  onLog(`✨ Đã dọn dẹp thành công tổng cộng ${deletedCount} sự kiện!`);
}
