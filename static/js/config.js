// Timeline configuration (Hours 05:00 to 23:00)
const START_HOUR = 5;
const END_HOUR = 23;
const HOUR_HEIGHT = 52; // px per hour

const weekdayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

// Day focus themes & strategic roadmaps
const DAY_THEMES = [
  {
    title: "Thứ 2: Ở lại trường cả ngày (Tối ưu tuyệt đối)",
    desc: "Nấu cơm & ăn trưa tại nhà lúc 08h • 2 ca học: 10:00 Kiểm thử PM (P.207-B) & 16:00 Quản lý DA (P.104-B) • Học TA & Ôn bài tại Thư viện trường • Tiết kiệm 1h15p di chuyển",
    icon: "fa-school",
    color: "text-indigo-400"
  },
  {
    title: "Thứ 3: Lập trình mạng & Lab Socket",
    desc: "07:00 Lập trình mạng (P.204-A) • 10:15 Ôn & Code Lab Socket TCP/UDP • TA Trưa & Tối • Sprint Feature Dự án",
    icon: "fa-network-wired",
    color: "text-sky-400"
  },
  {
    title: "Thứ 4: Tự học 100% & Hoàn thành Bài tập lớn",
    desc: "Cả ngày ở nhà tập trung sâu • Assignment & Bài tập lớn môn học • TA Reading 2 (Phân tích & Inferences) • Core Architecture & DB",
    icon: "fa-laptop-code",
    color: "text-emerald-400"
  },
  {
    title: "Thứ 5: Thu thập & Phân tích Yêu cầu PM",
    desc: "Sáng đọc SRS • 10:00 Thu thập YC (P.101-A) • Chiều làm bài tập SRS & User Stories • Tối xây dựng API & Frontend",
    icon: "fa-file-lines",
    color: "text-purple-400"
  },
  {
    title: "Thứ 6: Trí tuệ nhân tạo & Hệ QT CSDL",
    desc: "2 ca sáng: 07:00 AI (P.507-B) & 10:00 CSDL (P.201-B) • Chiều Code Lab AI & Thực hành SQL Trigger • Tối Deploy CI/CD",
    icon: "fa-brain",
    color: "text-amber-400"
  },
  {
    title: "Thứ 7: Nghiên cứu Tech & Sprint Portfolio",
    desc: "Sáng Open Source & Nghiên cứu Tech • Chiều Sprint Portfolio cá nhân • TA Writing Task • Tối Testing & Refactoring",
    icon: "fa-code-branch",
    color: "text-indigo-400"
  },
  {
    title: "Chủ Nhật: Review tuần & Luyện LeetCode",
    desc: "Luyện thuật toán / LeetCode chuyên sâu • Ôn 100% Anki cả Unit • Speaking Test Review • Hoàn thiện Docs & Kế hoạch tuần mới",
    icon: "fa-trophy",
    color: "text-rose-400"
  }
];

// Category styling & metadata
const CATEGORY_META = {
  university: {
    name: "Môn Trường",
    icon: "fa-graduation-cap",
    bg: "bg-indigo-50 border-indigo-200/90 text-indigo-950 dark:bg-indigo-950/70 dark:border-indigo-800/80 dark:text-indigo-100",
    badge: "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border dark:border-indigo-700/50",
    dot: "bg-indigo-500",
    cardBorder: "border-l-4 border-l-indigo-600 dark:border-l-indigo-500"
  },
  healthy: {
    name: "Chạy Bộ",
    icon: "fa-person-running",
    bg: "bg-emerald-50 border-emerald-200/90 text-emerald-950 dark:bg-emerald-950/70 dark:border-emerald-800/80 dark:text-emerald-100",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border dark:border-emerald-700/50",
    dot: "bg-emerald-500",
    cardBorder: "border-l-4 border-l-emerald-500"
  },
  english: {
    name: "Tiếng Anh",
    icon: "fa-language",
    bg: "bg-amber-50 border-amber-200/90 text-amber-950 dark:bg-amber-950/70 dark:border-amber-800/80 dark:text-amber-100",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 dark:border dark:border-amber-700/50",
    dot: "bg-amber-500",
    cardBorder: "border-l-4 border-l-amber-500"
  },
  code: {
    name: "Luyện Code",
    icon: "fa-code",
    bg: "bg-sky-50 border-sky-200/90 text-sky-950 dark:bg-sky-950/70 dark:border-sky-800/80 dark:text-sky-100",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 dark:border dark:border-sky-700/50",
    dot: "bg-sky-500",
    cardBorder: "border-l-4 border-l-sky-500"
  },
  project: {
    name: "Dự Án",
    icon: "fa-rocket",
    bg: "bg-purple-50 border-purple-200/90 text-purple-950 dark:bg-purple-950/70 dark:border-purple-800/80 dark:text-purple-100",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 dark:border dark:border-purple-700/50",
    dot: "bg-purple-500",
    cardBorder: "border-l-4 border-l-purple-500"
  },
  life: {
    name: "Nấu Cơm / Đi Lại",
    icon: "fa-utensils",
    bg: "bg-orange-50 border-orange-200/90 text-orange-950 dark:bg-orange-950/70 dark:border-orange-800/80 dark:text-orange-100",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 dark:border dark:border-orange-700/50",
    dot: "bg-orange-500",
    cardBorder: "border-l-4 border-l-orange-500"
  },
  leisure: {
    name: "Giải Trí",
    icon: "fa-gamepad",
    bg: "bg-rose-50 border-rose-200/90 text-rose-950 dark:bg-rose-950/70 dark:border-rose-800/80 dark:text-rose-100",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 dark:border dark:border-rose-700/50",
    dot: "bg-rose-500",
    cardBorder: "border-l-4 border-l-rose-500"
  }
};

// Convert time string "HH:MM" or "HH:MM:SS" to minutes from 00:00
function timeToMinutes(timeStr) {
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Format minutes to "Xh Yp" or "X phút"
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h}h ${m}p`;
}

// Dynamic Week & Date helpers
let currentWeekOffset = 0; // 0 = current week, -1 = last week, +1 = next week

function getMondayOfWeek(offset = 0) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon... 6 = Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + (offset * 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDates(offset = 0) {
  const monday = getMondayOfWeek(offset);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${date}`;
    days.push({
      weekday: i,
      dateObj: d,
      dateStr: dateStr,
      dayOfMonth: d.getDate(),
      month: d.getMonth() + 1,
      year: y,
      formattedShort: `${date}/${m}`,
      formattedFull: `${date}/${m}/${y}`
    });
  }
  return days;
}

function getWeekRangeLabel(offset = 0) {
  const days = getWeekDates(offset);
  const start = days[0];
  const end = days[6];
  if (offset === 0) {
    return `Tuần này (${start.formattedShort} – ${end.formattedFull})`;
  } else if (offset === -1) {
    return `Tuần trước (${start.formattedShort} – ${end.formattedFull})`;
  } else if (offset === 1) {
    return `Tuần sau (${start.formattedShort} – ${end.formattedFull})`;
  } else {
    return `Tuần ${start.formattedShort} – ${end.formattedFull}`;
  }
}

