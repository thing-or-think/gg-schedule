import { CategoryMeta, CategoryType, Course, DayTheme } from '../models/types.ts';

export const START_HOUR = 5;
export const END_HOUR = 23;
export const HOUR_HEIGHT = 52; // px per hour

export const WEEKDAY_NAMES = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật"
];

export const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12"
];

export const DAY_THEMES: DayTheme[] = [
  {
    title: "Thứ 2: Kiểm thử PM & Quản lý DA",
    desc: "07:00 Chuẩn bị Kiểm thử • 10:00 Kiểm thử PM (P.207-B) • 14:45 Chuẩn bị QLDA tại TV • 16:00 Quản lý DA (P.104-B) • Tối Ôn Test & Chuẩn bị Mạng",
    icon: "fa-school",
    color: "text-indigo-400"
  },
  {
    title: "Thứ 3: Lập trình mạng & Ôn tập thực hành",
    desc: "07:00 Lập trình mạng (P.204-A) • 10:15 Ôn & Code Lab Mạng ngay • TA Trưa & Tối • Sprint Feature • Tối ôn Quản lý DA & BTL",
    icon: "fa-network-wired",
    color: "text-sky-400"
  },
  {
    title: "Thứ 4: Tự học 100% & Thiết kế Kiến trúc",
    desc: "Sáng ôn Mạng, Kiểm thử PM, Chuẩn bị Thu thập YC & CSDL • Chiều DA Architecture • Tối code API & Backend",
    icon: "fa-laptop-code",
    color: "text-emerald-400"
  },
  {
    title: "Thứ 5: Thu thập & Phân tích Yêu cầu PM",
    desc: "Sáng chuẩn bị SRS • 10:00 Thu thập YC (P.101-A) • Chiều viết SRS & Chuẩn bị CSDL • Tối chuẩn bị AI tìm kiếm",
    icon: "fa-file-lines",
    color: "text-purple-400"
  },
  {
    title: "Thứ 6: Trí tuệ nhân tạo & Hệ QT CSDL",
    desc: "2 ca sáng: 07:00 AI (P.507-B) & 10:00 CSDL (P.201-B) • Chiều ôn AI & Lab CSDL nâng cao • Tối Deploy CI/CD",
    icon: "fa-brain",
    color: "text-amber-400"
  },
  {
    title: "Thứ 7: Ôn tập CSDL, AI & Sprint Portfolio",
    desc: "Sáng LeetCode & Code AI • 10:00 Ôn CSDL (SQL/Index) & SRS • Chiều Sprint Portfolio • Tối Testing & Refactor",
    icon: "fa-code-branch",
    color: "text-indigo-400"
  },
  {
    title: "Chủ Nhật: LeetCode chuyên sâu & Kế hoạch tuần mới",
    desc: "Sáng LeetCode chuyên sâu • 10:00 Tech Open Source • Chiều Docs & Demo • Tối Chuẩn bị tuần mới (Kiểm thử, QLDA)",
    icon: "fa-trophy",
    color: "text-rose-400"
  }
];

export const CATEGORY_META: Record<CategoryType, CategoryMeta> = {
  university: {
    name: "Môn Trường",
    icon: "fa-graduation-cap",
    bg: "bg-indigo-50 border-indigo-200/90 text-indigo-950 dark:bg-indigo-950/70 dark:border-indigo-800/80 dark:text-indigo-100",
    badge: "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border dark:border-indigo-700/50",
    dot: "bg-indigo-500",
    cardBorder: "border-l-4 border-l-indigo-600 dark:border-l-indigo-500",
    colorId: "9",
    emoji: "🏫"
  },
  healthy: {
    name: "Chạy Bộ",
    icon: "fa-person-running",
    bg: "bg-emerald-50 border-emerald-200/90 text-emerald-950 dark:bg-emerald-950/70 dark:border-emerald-800/80 dark:text-emerald-100",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border dark:border-emerald-700/50",
    dot: "bg-emerald-500",
    cardBorder: "border-l-4 border-l-emerald-500",
    colorId: "10",
    emoji: "🏃"
  },
  english: {
    name: "Tiếng Anh",
    icon: "fa-language",
    bg: "bg-amber-50 border-amber-200/90 text-amber-950 dark:bg-amber-950/70 dark:border-amber-800/80 dark:text-amber-100",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 dark:border dark:border-amber-700/50",
    dot: "bg-amber-500",
    cardBorder: "border-l-4 border-l-amber-500",
    colorId: "5",
    emoji: "🇬🇧"
  },
  code: {
    name: "Luyện Code",
    icon: "fa-code",
    bg: "bg-sky-50 border-sky-200/90 text-sky-950 dark:bg-sky-950/70 dark:border-sky-800/80 dark:text-sky-100",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 dark:border dark:border-sky-700/50",
    dot: "bg-sky-500",
    cardBorder: "border-l-4 border-l-sky-500",
    colorId: "7",
    emoji: "💻"
  },
  project: {
    name: "Dự Án",
    icon: "fa-rocket",
    bg: "bg-purple-50 border-purple-200/90 text-purple-950 dark:bg-purple-950/70 dark:border-purple-800/80 dark:text-purple-100",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 dark:border dark:border-purple-700/50",
    dot: "bg-purple-500",
    cardBorder: "border-l-4 border-l-purple-500",
    colorId: "3",
    emoji: "🚀"
  },
  life: {
    name: "Nấu Cơm / Đi Lại",
    icon: "fa-utensils",
    bg: "bg-orange-50 border-orange-200/90 text-orange-950 dark:bg-orange-950/70 dark:border-orange-800/80 dark:text-orange-100",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 dark:border dark:border-orange-700/50",
    dot: "bg-orange-500",
    cardBorder: "border-l-4 border-l-orange-500",
    colorId: "6",
    emoji: "🍳"
  },
  leisure: {
    name: "Giải Trí",
    icon: "fa-gamepad",
    bg: "bg-rose-50 border-rose-200/90 text-rose-950 dark:bg-rose-950/70 dark:border-rose-800/80 dark:text-rose-100",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 dark:border dark:border-rose-700/50",
    dot: "bg-rose-500",
    cardBorder: "border-l-4 border-l-rose-500",
    colorId: "11",
    emoji: "🎮"
  }
};

export const DEFAULT_UNIVERSITY_COURSES: Course[] = [
  {
    code: "INT3117",
    name: "Kiểm thử và đảm bảo chất lượng phần mềm",
    class: "INT3117 3",
    room: "207-B",
    category: "university",
    weekday: 0,
    start_time: "10:00:00",
    end_time: "12:40:00"
  },
  {
    code: "INT3111",
    name: "Quản lý dự án phần mềm",
    class: "INT3111 2",
    room: "104-B",
    category: "university",
    weekday: 0,
    start_time: "16:00:00",
    end_time: "18:40:00"
  },
  {
    code: "INT3304",
    name: "Lập trình mạng",
    class: "INT3304 1",
    room: "204-A",
    category: "university",
    weekday: 1,
    start_time: "07:00:00",
    end_time: "09:40:00"
  },
  {
    code: "INT3109",
    name: "Thu thập và phân tích yêu cầu",
    class: "INT3109 1",
    room: "101-A",
    category: "university",
    weekday: 3,
    start_time: "10:00:00",
    end_time: "12:40:00"
  },
  {
    code: "INT3401",
    name: "Trí tuệ nhân tạo",
    class: "INT3401 5",
    room: "507-B",
    category: "university",
    weekday: 4,
    start_time: "07:00:00",
    end_time: "09:40:00"
  },
  {
    code: "INT3202",
    name: "Hệ quản trị cơ sở dữ liệu",
    class: "INT3202 2",
    room: "201-B",
    category: "university",
    weekday: 4,
    start_time: "10:00:00",
    end_time: "12:40:00"
  }
];
