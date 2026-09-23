// Main Application State & Coordinator

let courses = [];
let currentFilter = "all";
let currentView = "week"; // "day", "week", "month", "list"
let selectedWeekday = (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
let currentMonth = new Date().getMonth(); // 0-indexed month
let currentYear = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Theme System
  if (typeof initTheme === "function") {
    initTheme();
  }

  buildTimelineBackground();
  buildDayTimelineBackground();
  loadCourses();
  calculateDuration();

  // Initialize Real-time Live Clock, Now indicator line, and Current Task Finder
  if (typeof initRealtimeTracker === "function") {
    initRealtimeTracker();
  }

  // Close preset dropdown on click outside
  document.addEventListener("click", (e) => {
    const menu = document.getElementById("preset-dropdown");
    const btn = document.getElementById("btn-preset-menu");
    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });
});

// Toast notification helper
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const isSuccess = type === "success";
  toast.className = `flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold text-white animate-in slide-in-from-right duration-200 ${
    isSuccess ? "bg-slate-900 dark:bg-slate-800 border-slate-800 dark:border-slate-700" : "bg-rose-600 border-rose-500"
  }`;
  toast.innerHTML = `<i class="fa-solid ${isSuccess ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation'}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Switch view tabs (Day / Week / Month / List)
function switchTab(tab) {
  currentView = tab;
  const dayView = document.getElementById("view-day");
  const weekView = document.getElementById("view-week");
  const monthView = document.getElementById("view-month");
  const listView = document.getElementById("view-list");

  const dayBtn = document.getElementById("tab-day-btn");
  const weekBtn = document.getElementById("tab-week-btn");
  const monthBtn = document.getElementById("tab-month-btn");
  const listBtn = document.getElementById("tab-list-btn");

  const activeBtnClass = "px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm transition flex items-center";
  const inactiveBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center";

  if (dayView) dayView.classList.add("hidden");
  if (weekView) weekView.classList.add("hidden");
  if (monthView) monthView.classList.add("hidden");
  if (listView) listView.classList.add("hidden");

  if (dayBtn) dayBtn.className = inactiveBtnClass;
  if (weekBtn) weekBtn.className = inactiveBtnClass;
  if (monthBtn) monthBtn.className = inactiveBtnClass;
  if (listBtn) listBtn.className = inactiveBtnClass;

  if (tab === "day") {
    if (dayView) dayView.classList.remove("hidden");
    if (dayBtn) dayBtn.className = activeBtnClass;
    buildDayTimelineBackground();
    renderDayView();
  } else if (tab === "week") {
    if (weekView) weekView.classList.remove("hidden");
    if (weekBtn) weekBtn.className = activeBtnClass;
    renderTimelineEvents();
  } else if (tab === "month") {
    if (monthView) monthView.classList.remove("hidden");
    if (monthBtn) monthBtn.className = activeBtnClass;
    renderMonthView();
  } else if (tab === "list") {
    if (listView) listView.classList.remove("hidden");
    if (listBtn) listBtn.className = activeBtnClass;
    renderListView();
  }

  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
  if (typeof updateRealtimeTracker === "function") {
    updateRealtimeTracker();
  }
}

// Update counters in category filters & weekly statistics overview
function updateCategoryCountsAndStats() {
  const counts = { all: courses.length, university: 0, english: 0, code: 0, project: 0, healthy: 0, life: 0, leisure: 0 };
  const minutes = { university: 0, english: 0, code: 0, project: 0, healthy: 0, life: 0, leisure: 0 };

  courses.forEach(c => {
    const cat = c.category || "university";
    if (counts[cat] !== undefined) counts[cat]++;
    const s = timeToMinutes(c.start_time);
    const e = timeToMinutes(c.end_time);
    if (minutes[cat] !== undefined) minutes[cat] += Math.max(e - s, 0);
  });

  // Update counters in filter chips
  const countAll = document.getElementById("count-all");
  if (countAll) countAll.innerText = counts.all;
  const countUniv = document.getElementById("count-university");
  if (countUniv) countUniv.innerText = counts.university;
  const countHealthy = document.getElementById("count-healthy");
  if (countHealthy) countHealthy.innerText = counts.healthy;
  const countEnglish = document.getElementById("count-english");
  if (countEnglish) countEnglish.innerText = counts.english;
  const countCode = document.getElementById("count-code");
  if (countCode) countCode.innerText = counts.code;
  const countProject = document.getElementById("count-project");
  if (countProject) countProject.innerText = counts.project;
  const countLife = document.getElementById("count-life");
  if (countLife) countLife.innerText = counts.life;
  const countLeisure = document.getElementById("count-leisure");
  if (countLeisure) countLeisure.innerText = counts.leisure;

  // Update stats overview
  let totalMins = 0;
  Object.values(minutes).forEach(m => totalMins += m);
  const totalHoursBadge = document.getElementById("total-hours-badge");
  if (totalHoursBadge) {
    totalHoursBadge.innerText = `Tổng hoạt động: ${Math.round(totalMins / 60 * 10) / 10}h / tuần`;
  }

  const statsContainer = document.getElementById("stats-container");
  if (!statsContainer) return;
  statsContainer.innerHTML = "";

  const activeCategories = ["university", "healthy", "english", "code", "project", "life"];
  activeCategories.forEach(cat => {
    const meta = CATEGORY_META[cat];
    const h = Math.round(minutes[cat] / 60 * 10) / 10;
    const div = document.createElement("div");
    div.className = "p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex flex-col transition-colors";
    div.innerHTML = `
      <div class="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <span class="w-2 h-2 rounded-full ${meta.dot}"></span>
        <span class="truncate">${meta.name}</span>
      </div>
      <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">${h}h</div>
    `;
    statsContainer.appendChild(div);
  });
}

function refreshCurrentView() {
  updateCategoryCountsAndStats();
  if (currentView === "day") renderDayView();
  else if (currentView === "week") renderTimelineEvents();
  else if (currentView === "month") renderMonthView();
  else if (currentView === "list") renderListView();

  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
  if (typeof updateRealtimeTracker === "function") {
    updateRealtimeTracker();
  }
}

// Filter category
function filterCategory(cat) {
  currentFilter = cat;
  document.querySelectorAll(".cat-filter-btn").forEach(btn => {
    if (btn.getAttribute("data-cat") === cat) {
      btn.className = "cat-filter-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 dark:bg-indigo-600 text-white transition shadow-xs";
    } else {
      btn.className = "cat-filter-btn px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition";
    }
  });
  refreshCurrentView();
}

// Load Courses from Server
async function loadCourses() {
  try {
    courses = await fetchCoursesApi();
    refreshCurrentView();
  } catch (err) {
    showToast("Lỗi tải danh sách: " + err.message, "error");
  }
}
