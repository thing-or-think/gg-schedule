import { Course, CategoryType } from '../models/types.ts';
import { CATEGORY_META } from '../constants/config.ts';

function formatICSDate(date: Date, timeStr: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  const parts = timeStr.split(':');
  const hh = String(parts[0] || '00').padStart(2, '0');
  const mm = String(parts[1] || '00').padStart(2, '0');
  const ss = String(parts[2] || '00').padStart(2, '0');

  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

function formatUTCStamp(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function getFirstOccurrence(startDate: Date, targetWeekday: number): Date {
  // targetWeekday: 0=Thứ 2, 6=Chủ nhật
  const startDay = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
  const daysAhead = (targetWeekday - startDay + 7) % 7;
  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + daysAhead);
  return result;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Tạo nội dung file .ics chuẩn RFC 5545 và kích hoạt tải về máy
 */
export function exportToICS(
  courses: Course[],
  startDateStr: string = '2026-09-01',
  endDateStr: string = '2026-12-31',
  categoriesFilter?: CategoryType[]
): void {
  const startDate = new Date(startDateStr + 'T00:00:00');
  const endDate = new Date(endDateStr + 'T23:59:59');

  let filteredCourses = courses;
  if (categoriesFilter && categoriesFilter.length > 0) {
    filteredCourses = courses.filter((c) => categoriesFilter.includes(c.category));
  }

  // Mốc kết thúc tuần UTC (23:59:59 GMT+7 -> 16:59:59 UTC)
  const untilYear = endDate.getFullYear();
  const untilMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const untilDay = String(endDate.getDate()).padStart(2, '0');
  const untilStr = `${untilYear}${untilMonth}${untilDay}T165959Z`;

  const nowStamp = formatUTCStamp(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Thoi Khoa Bieu Sinh Vien & Self-Study//VN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Thời khóa biểu & Lịch Tự Học (09/2026 - 12/2026)',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Ho_Chi_Minh',
    'X-LIC-LOCATION:Asia/Ho_Chi_Minh',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0700',
    'TZOFFSETTO:+0700',
    'TZNAME:+07',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];

  filteredCourses.forEach((c, idx) => {
    const cat = c.category || 'university';
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;
    const emoji = meta.emoji;
    const locationStr = cat === 'university' ? `Giảng đường ${c.room || ''}` : (c.room || 'Ở nhà');

    const firstDay = getFirstOccurrence(startDate, c.weekday);
    const dtStart = formatICSDate(firstDay, c.start_time);
    const dtEnd = formatICSDate(firstDay, c.end_time);

    const summary = `${emoji} [${c.code}] ${c.name}`;
    const description = `Hoạt động: ${c.name}\nPhân loại: ${cat.toUpperCase()}\nGhi chú: ${c.class || ''}\nĐịa điểm: ${locationStr}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:gg-cal-${Date.now()}-${idx}-${c.code}@schedule`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
      `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`,
      `SUMMARY:${escapeICS(summary)}`,
      `LOCATION:${escapeICS(locationStr)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(`Nhắc nhở: Sắp đến giờ [${c.name}]`)}`,
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `thoikhoabieu_${startDateStr}_${endDateStr}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
