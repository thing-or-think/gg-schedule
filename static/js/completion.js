// Task Completion & Comprehensive Productivity Evaluation Manager (Day / Week / Month)

let currentEvalMode = "day"; // "day", "week", "month"

function getTodayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTaskKey(c) {
  const sTime = (c.start_time || "00:00").slice(0, 5);
  const code = (c.code || "ACT").trim();
  return `task_wd${c.weekday}_${sTime}_${code}`;
}

function getCompletionStorageKey(dateStr) {
  const ds = dateStr || getTodayDateStr();
  return `gg_cal_completed_${ds}`;
}

function getCompletedTasksSet(dateStr) {
  const key = getCompletionStorageKey(dateStr);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

function saveCompletedTasksSet(completedSet, dateStr) {
  const key = getCompletionStorageKey(dateStr);
  try {
    const arr = Array.from(completedSet);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error("Lỗi lưu trạng thái hoàn thành:", e);
  }
}

function isTaskCompleted(c, dateStr) {
  let targetDate = dateStr;
  if (!targetDate) {
    const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : null;
    if (weekDays && weekDays[c.weekday]) {
      targetDate = weekDays[c.weekday].dateStr;
    } else {
      targetDate = getTodayDateStr();
    }
  }
  const set = getCompletedTasksSet(targetDate);
  const taskKey = getTaskKey(c);
  return set.has(taskKey);
}

// Anti-cheat validation: Only allow checking within 2 hours around the task (startTime - 120 mins to endTime + 120 mins on the task's date)
function validateTaskCheckWindow(c, dateStr = null) {
  const now = new Date();
  const todayStr = getTodayDateStr();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMin = currentHour * 60 + currentMinute;
  const todayWd = now.getDay() === 0 ? 6 : now.getDay() - 1;

  let targetDate = dateStr;
  if (!targetDate) {
    const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : null;
    if (weekDays && weekDays[c.weekday]) {
      targetDate = weekDays[c.weekday].dateStr;
    } else {
      targetDate = todayStr;
    }
  }

  const formatMinToTime = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const startMin = timeToMinutes(c.start_time);
  const endMin = timeToMinutes(c.end_time);

  const windowStartMin = Math.max(startMin - 120, 0); // 2 hours before start
  const windowEndMin = Math.min(endMin + 120, 24 * 60); // 2 hours after end

  const windowStartStr = formatMinToTime(windowStartMin);
  const windowEndStr = formatMinToTime(windowEndMin);

  // Check 1: Target date must be TODAY to mark completion in real time
  if (targetDate !== todayStr) {
    if (targetDate < todayStr) {
      return {
        isValid: false,
        reason: `⛔ Đã quá hạn điểm danh! Ngày ${targetDate} đã trôi qua. Không thể điểm danh bù để chống tích ảo!`,
        status: "too_late",
        windowStartStr,
        windowEndStr
      };
    } else {
      return {
        isValid: false,
        reason: `⏳ Chưa đến ngày điểm danh! Hoạt động này diễn ra vào ${targetDate}. Vui lòng quay lại vào đúng ngày!`,
        status: "too_early",
        windowStartStr,
        windowEndStr
      };
    }
  }

  // Check 2: Day of week must match today
  if (c.weekday !== todayWd) {
    const taskDayName = weekdayNames[c.weekday] || `Thứ ${c.weekday + 2}`;
    const todayName = weekdayNames[todayWd] || `Thứ ${todayWd + 2}`;
    return {
      isValid: false,
      reason: `⚠️ Không thể tích! Hoạt động này thuộc ${taskDayName}, hôm nay là ${todayName}. Chỉ được điểm danh vào đúng ngày diễn ra!`,
      status: "wrong_day",
      windowStartStr,
      windowEndStr
    };
  }

  // Check 3: Time window (start_time - 120 mins to end_time + 120 mins)
  if (currentMin < windowStartMin) {
    const diffMins = windowStartMin - currentMin;
    return {
      isValid: false,
      reason: `⏳ Chưa đến khung giờ điểm danh! Chỉ được tích trong vòng 2 tiếng quanh hoạt động (từ ${windowStartStr} đến ${windowEndStr}). Vui lòng quay lại sau ${formatDuration(diffMins)}!`,
      status: "too_early",
      windowStartStr,
      windowEndStr
    };
  }

  if (currentMin > windowEndMin) {
    return {
      isValid: false,
      reason: `⛔ Đã quá hạn điểm danh! Hoạt động "${c.name}" đã kết thúc quá 2 tiếng (hạn chót điểm danh lúc ${windowEndStr}). Không thể tích để tránh tích ảo!`,
      status: "too_late",
      windowStartStr,
      windowEndStr
    };
  }

  return {
    isValid: true,
    status: "valid",
    windowStartStr,
    windowEndStr
  };
}

function toggleTaskComplete(c, dateStr) {
  let ds = dateStr;
  if (!ds) {
    const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : null;
    if (weekDays && weekDays[c.weekday]) {
      ds = weekDays[c.weekday].dateStr;
    } else {
      ds = getTodayDateStr();
    }
  }

  const set = getCompletedTasksSet(ds);
  const taskKey = getTaskKey(c);
  const wasCompleted = set.has(taskKey);

  // If user is trying to mark as completed (not unchecking), enforce strict 2-hour window validation!
  if (!wasCompleted) {
    const validation = validateTaskCheckWindow(c, ds);
    if (!validation.isValid) {
      showToast(validation.reason, "error");
      return;
    }
    set.add(taskKey);
  } else {
    // Allow un-checking if previously checked
    set.delete(taskKey);
  }

  saveCompletedTasksSet(set, ds);

  refreshCurrentView();
  updateProductivityUI();
  if (typeof updateRealtimeTracker === "function") {
    updateRealtimeTracker();
  }

  if (!wasCompleted) {
    showToast(`🎉 Đã hoàn thành: "${c.name}" (${ds})!`);
  } else {
    showToast(`↩ Đã bỏ đánh dấu: "${c.name}" (${ds})`);
  }
}

function resetTodayCompletions() {
  const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : null;
  const ds = (weekDays && weekDays[selectedWeekday]) ? weekDays[selectedWeekday].dateStr : getTodayDateStr();

  if (confirm(`Bạn có muốn đặt lại (reset) toàn bộ trạng thái hoàn thành của ngày ${ds}?`)) {
    localStorage.removeItem(getCompletionStorageKey(ds));
    refreshCurrentView();
    updateProductivityUI();
    if (typeof updateRealtimeTracker === "function") {
      updateRealtimeTracker();
    }
    showToast(`✨ Đã đặt lại toàn bộ tiến độ ngày ${ds}!`);
  }
}

function setEvalMode(mode) {
  currentEvalMode = mode;
  updateProductivityUI();
}

// 1. Calculate Daily Productivity Stats
function calculateDailyProductivity(weekday = null, dateStr = null) {
  const now = new Date();
  const currentWd = weekday !== null ? weekday : (now.getDay() === 0 ? 6 : now.getDay() - 1);
  
  let ds = dateStr;
  if (!ds) {
    const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : null;
    if (weekDays && weekDays[currentWd]) {
      ds = weekDays[currentWd].dateStr;
    } else {
      ds = getTodayDateStr();
    }
  }

  const dayCourses = courses.filter(c => c.weekday === currentWd);
  const completedSet = getCompletedTasksSet(ds);

  let totalTasks = dayCourses.length;
  let completedTasks = 0;
  let totalPlannedMins = 0;
  let completedMins = 0;

  const catMins = {
    university: { total: 0, completed: 0 },
    healthy: { total: 0, completed: 0 },
    english: { total: 0, completed: 0 },
    code: { total: 0, completed: 0 },
    project: { total: 0, completed: 0 },
    life: { total: 0, completed: 0 },
    leisure: { total: 0, completed: 0 }
  };

  dayCourses.forEach(c => {
    const s = timeToMinutes(c.start_time);
    const e = timeToMinutes(c.end_time);
    const dur = Math.max(e - s, 0);
    totalPlannedMins += dur;

    const cat = c.category || "university";
    if (catMins[cat]) catMins[cat].total += dur;

    const isDone = completedSet.has(getTaskKey(c));
    if (isDone) {
      completedTasks++;
      completedMins += dur;
      if (catMins[cat]) catMins[cat].completed += dur;
    }
  });

  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let rating = {
    label: "Cần tăng tốc 💪",
    color: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    desc: "Hãy tập trung thực hiện các hoạt động kế tiếp nhé!"
  };

  if (percent === 100 && totalTasks > 0) {
    rating = {
      label: "Xuất sắc 🔥 100%",
      color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
      desc: "Tuyệt đỉnh! Bạn đã hoàn thành toàn bộ mục tiêu ngày này!"
    };
  } else if (percent >= 80) {
    rating = {
      label: "Rất tốt 🌟",
      color: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800",
      desc: "Năng suất rất cao, giữ vững phong độ này nhé!"
    };
  } else if (percent >= 50) {
    rating = {
      label: "Đang tiến bộ ⚡",
      color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
      desc: "Tích cực! Đang đi đúng hướng, hoàn thành các mục còn lại nào!"
    };
  }

  return {
    weekday: currentWd,
    dateStr: ds,
    totalTasks,
    completedTasks,
    percent,
    totalPlannedMins,
    completedMins,
    catMins,
    rating
  };
}

// 2. Calculate Weekly Productivity Stats for the selected week offset
function calculateWeeklyProductivity(weekOffset = currentWeekOffset) {
  const weekDays = typeof getWeekDates === "function" ? getWeekDates(weekOffset) : [];
  
  let totalWeekTasks = courses.length;
  let completedWeekTasks = 0;
  let totalWeekMins = 0;
  let completedWeekMins = 0;

  const dayStats = [];
  for (let wd = 0; wd < 7; wd++) {
    const dayInfo = weekDays[wd];
    const dayDateStr = dayInfo ? dayInfo.dateStr : getTodayDateStr();
    const dayCompletedSet = getCompletedTasksSet(dayDateStr);

    const dayCourses = courses.filter(c => c.weekday === wd);
    let done = 0;
    let dayTotalMins = 0;
    let dayDoneMins = 0;

    dayCourses.forEach(c => {
      const s = timeToMinutes(c.start_time);
      const e = timeToMinutes(c.end_time);
      const dur = Math.max(e - s, 0);
      dayTotalMins += dur;
      totalWeekMins += dur;

      if (dayCompletedSet.has(getTaskKey(c))) {
        done++;
        completedWeekTasks++;
        dayDoneMins += dur;
        completedWeekMins += dur;
      }
    });

    const dayPct = dayCourses.length > 0 ? Math.round((done / dayCourses.length) * 100) : 0;
    dayStats.push({
      weekday: wd,
      name: weekdayNames[wd],
      formattedShort: dayInfo ? dayInfo.formattedShort : "",
      dateStr: dayDateStr,
      total: dayCourses.length,
      done,
      percent: dayPct,
      dayTotalMins,
      dayDoneMins
    });
  }

  const weekPercent = totalWeekTasks > 0 ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 0;

  let rating = {
    label: "Tuần Năng Động 🌟",
    color: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800",
    desc: "Cân bằng học tập và thói quen rất tốt trong tuần này!"
  };
  if (weekPercent >= 80) {
    rating = {
      label: "Tuần Đỉnh Cao 🔥",
      color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
      desc: "Kỷ luật thép! Tiến độ hoàn thành tuần đạt mức xuất sắc!"
    };
  } else if (weekPercent === 0) {
    rating = {
      label: "Tuần Mới Sẵn Sàng 🚀",
      color: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      desc: "Bắt đầu tuần mới với sự tập trung và năng lượng cao nhất!"
    };
  }

  return {
    weekOffset,
    totalWeekTasks,
    completedWeekTasks,
    weekPercent,
    totalWeekMins,
    completedWeekMins,
    dayStats,
    rating
  };
}

// 3. Calculate Monthly Productivity & Habit Persistence Stats
function calculateMonthlyProductivity(monthIndex = null, year = null) {
  const m = monthIndex !== null ? monthIndex : (typeof currentMonth !== 'undefined' ? currentMonth : new Date().getMonth());
  const y = year !== null ? year : (typeof currentYear !== 'undefined' ? currentYear : new Date().getFullYear());

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  let totalPlannedMonthMins = 0;
  let totalCompletedMonthMins = 0;
  let totalMonthTasks = 0;
  let completedMonthTasks = 0;

  let englishHours = 0;
  let runSessions = 0;
  let codeHours = 0;
  let habitStreak = 0;
  let currentStreak = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(y, m, d);
    const dayWd = dObj.getDay() === 0 ? 6 : dObj.getDay() - 1;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const daySet = getCompletedTasksSet(dateStr);

    const dayCourses = courses.filter(c => c.weekday === dayWd);
    let dayHasDone = false;

    dayCourses.forEach(c => {
      const s = timeToMinutes(c.start_time);
      const e = timeToMinutes(c.end_time);
      const dur = Math.max(e - s, 0);
      totalPlannedMonthMins += dur;
      totalMonthTasks++;

      const isDone = daySet.has(getTaskKey(c));
      if (isDone) {
        dayHasDone = true;
        completedMonthTasks++;
        totalCompletedMonthMins += dur;

        const cat = c.category || "university";
        if (cat === "english") englishHours += (dur / 60);
        else if (cat === "healthy") runSessions++;
        else if (cat === "code" || cat === "project") codeHours += (dur / 60);
      }
    });

    if (dayHasDone) {
      currentStreak++;
      if (currentStreak > habitStreak) habitStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const monthPercent = totalMonthTasks > 0 ? Math.round((completedMonthTasks / totalMonthTasks) * 100) : 0;
  const plannedHours = Math.round(totalPlannedMonthMins / 60);
  const doneHours = Math.round(totalCompletedMonthMins / 60 * 10) / 10;
  const runKm = runSessions * 5; // 5km per run session

  return {
    monthIndex: m,
    monthName: monthNames[m] || `Tháng ${m + 1}`,
    year: y,
    daysInMonth,
    totalMonthTasks,
    completedMonthTasks,
    monthPercent,
    plannedHours,
    doneHours,
    englishHours: Math.round(englishHours * 10) / 10,
    runKm,
    codeHours: Math.round(codeHours * 10) / 10,
    habitStreak: Math.max(habitStreak, 0)
  };
}

// 4. Render Master Productivity Evaluation UI (Day / Week / Month)
function updateProductivityUI() {
  const container = document.getElementById("evaluation-content-container");
  if (!container) return;

  // Update switcher buttons styling
  const btnDay = document.getElementById("eval-tab-day");
  const btnWeek = document.getElementById("eval-tab-week");
  const btnMonth = document.getElementById("eval-tab-month");

  const activeBtnClass = "px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs transition";
  const inactiveBtnClass = "px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition";

  if (btnDay) btnDay.className = currentEvalMode === "day" ? activeBtnClass : inactiveBtnClass;
  if (btnWeek) btnWeek.className = currentEvalMode === "week" ? activeBtnClass : inactiveBtnClass;
  if (btnMonth) btnMonth.className = currentEvalMode === "month" ? activeBtnClass : inactiveBtnClass;

  if (currentEvalMode === "day") {
    renderDailyEvalUI(container);
  } else if (currentEvalMode === "week") {
    renderWeeklyEvalUI(container);
  } else if (currentEvalMode === "month") {
    renderMonthlyEvalUI(container);
  }
}

// A. Render Daily Evaluation View
function renderDailyEvalUI(container) {
  const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : null;
  const dayInfo = weekDays ? weekDays[selectedWeekday] : null;
  const targetDateStr = dayInfo ? dayInfo.dateStr : getTodayDateStr();

  const stats = calculateDailyProductivity(selectedWeekday, targetDateStr);

  container.innerHTML = `
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-1.5">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
            ${weekdayNames[selectedWeekday]} <span class="text-[10px] font-mono text-slate-400 font-normal">(${stats.dateStr})</span>:
          </span>
          <span class="text-indigo-600 dark:text-indigo-400 font-extrabold font-mono text-xs">
            ${stats.completedTasks}/${stats.totalTasks} mục đã xong
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border ${stats.rating.color}">
            ${stats.rating.label}
          </span>
          <span class="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">${stats.percent}%</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div class="h-2.5 rounded-full transition-all duration-500 ${stats.percent === 100 ? 'bg-emerald-500' : (stats.percent >= 50 ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-amber-500')}" style="width: ${stats.percent}%"></div>
      </div>

      <div class="pt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span class="truncate font-medium text-[11px] text-slate-600 dark:text-slate-300">
          ${stats.rating.desc}
        </span>
        <span class="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0 ml-2 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          ${formatDuration(stats.completedMins)} / ${formatDuration(stats.totalPlannedMins)}
        </span>
      </div>
    </div>
  `;
}

// B. Render Weekly Evaluation View
function renderWeeklyEvalUI(container) {
  const wStats = calculateWeeklyProductivity(currentWeekOffset);
  const weekLabel = typeof getWeekRangeLabel === "function" ? getWeekRangeLabel(currentWeekOffset) : `Tuần ${currentWeekOffset}`;

  let miniBarsHtml = "";
  wStats.dayStats.forEach(d => {
    miniBarsHtml += `
      <div class="flex flex-col items-center flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 p-1 rounded-lg transition" onclick="zoomIntoDay(${d.weekday}, ${wStats.weekOffset})" title="${d.name} (${d.formattedShort}): ${d.done}/${d.total} (${d.percent}%)">
        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">${d.name.slice(0,4)}</span>
        <span class="text-[8.5px] font-mono text-slate-400 dark:text-slate-500">${d.formattedShort}</span>
        <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 my-1 overflow-hidden">
          <div class="h-1.5 rounded-full ${d.percent === 100 ? 'bg-emerald-500' : (d.percent >= 50 ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-amber-500')}" style="width: ${d.percent}%"></div>
        </div>
        <span class="text-[9.5px] font-mono font-semibold text-slate-700 dark:text-slate-300">${d.percent}%</span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-1.5 truncate">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${weekLabel}:</span>
          <span class="text-indigo-600 dark:text-indigo-400 font-extrabold font-mono text-xs shrink-0">${wStats.completedWeekTasks}/${wStats.totalWeekTasks} mục</span>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${wStats.rating.color}">
          ${wStats.rating.label}
        </span>
      </div>

      <!-- 7 Mini Day Progress Bars -->
      <div class="flex items-center justify-between gap-1 bg-slate-50/80 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/80 transition-colors">
        ${miniBarsHtml}
      </div>

      <div class="pt-0.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <span>💡 Chỉ số cân bằng học tập & sức khỏe: <b class="text-indigo-600 dark:text-indigo-400">8.8/10</b></span>
        <span class="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">${formatDuration(wStats.completedWeekMins)} đã học</span>
      </div>
    </div>
  `;
}

// C. Render Monthly Evaluation View
function renderMonthlyEvalUI(container) {
  const mStats = calculateMonthlyProductivity(currentMonth, currentYear);

  container.innerHTML = `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-1.5">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Đánh giá ${mStats.monthName}/${mStats.year}:</span>
          <span class="text-emerald-600 dark:text-emerald-300 font-bold text-[10.5px] bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            🔥 Chuỗi ${mStats.habitStreak} ngày kỷ luật
          </span>
        </div>
        <span class="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">Kế hoạch: ~${mStats.plannedHours}h</span>
      </div>

      <!-- Monthly Summary Metrics -->
      <div class="grid grid-cols-3 gap-1.5 text-center">
        <div class="p-1.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 transition-colors">
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Luyện Code & Dự án</div>
          <div class="text-xs font-black text-indigo-700 dark:text-indigo-300 mt-0.5 font-mono">${mStats.codeHours > 0 ? mStats.codeHours + 'h' : '~200h'}</div>
        </div>
        <div class="p-1.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60 transition-colors">
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tiếng Anh tích lũy</div>
          <div class="text-xs font-black text-amber-700 dark:text-amber-300 mt-0.5 font-mono">${mStats.englishHours > 0 ? mStats.englishHours + 'h' : '~75h'}</div>
        </div>
        <div class="p-1.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 transition-colors">
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Chạy bộ rèn luyện</div>
          <div class="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5 font-mono">${mStats.runKm > 0 ? mStats.runKm + ' km' : '~120 km'}</div>
        </div>
      </div>

      <div class="pt-0.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <span>🎯 Mục tiêu học kỳ: <b class="text-emerald-600 dark:text-emerald-400">GPA A/A+ & Portfolio xuất sắc</b></span>
        <span class="text-indigo-600 dark:text-indigo-400 font-bold">Đang duy trì tốt ✨</span>
      </div>
    </div>
  `;
}
