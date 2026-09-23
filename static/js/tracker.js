// Real-time Tracker, Current Focus Pointer & Live Indicator

let realtimeTimer = null;

function initRealtimeTracker() {
  updateLiveClock();
  updateRealtimeTracker();

  if (!realtimeTimer) {
    realtimeTimer = setInterval(() => {
      updateLiveClock();
      updateRealtimeTracker();
    }, 1000);
  }
}

// 1. Live Clock Display (HH:MM:SS & Date)
function updateLiveClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  const clockEl = document.getElementById("live-clock-time");
  if (clockEl) {
    clockEl.innerText = `${h}:${m}:${s}`;
  }

  const dateEl = document.getElementById("live-clock-date");
  if (dateEl) {
    const todayWd = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const wdName = weekdayNames[todayWd] || "Hôm nay";
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    dateEl.innerText = `${wdName}, ${day}/${month}/${year}`;
  }
}

// 2. Identify Current & Next Activity and Update UI Indicators
function updateRealtimeTracker() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSeconds = now.getSeconds();
  const currentMin = currentHour * 60 + currentMinute;
  const todayWeekday = now.getDay() === 0 ? 6 : now.getDay() - 1;

  // Find today's courses sorted by start time
  const todayCourses = courses.filter(c => c.weekday === todayWeekday);
  todayCourses.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  let activeCourse = null;
  let nextCourse = null;

  for (const c of todayCourses) {
    const sMin = timeToMinutes(c.start_time);
    const eMin = timeToMinutes(c.end_time);

    if (currentMin >= sMin && currentMin < eMin) {
      activeCourse = c;
      break;
    } else if (currentMin < sMin && !nextCourse) {
      nextCourse = c;
    }
  }

  // Update Top Current Focus Card
  renderCurrentFocusCard(activeCourse, nextCourse, currentMin, todayWeekday);

  // Update Red "NOW" Line on Day View and Week View
  updateNowIndicatorLine(currentMin, todayWeekday);
}

// 3. Render Top "Mục Cần Làm Ngay Bây Giờ" Card
function renderCurrentFocusCard(activeCourse, nextCourse, currentMin, todayWeekday) {
  const cardContainer = document.getElementById("current-focus-card");
  if (!cardContainer) return;

  if (activeCourse) {
    const sMin = timeToMinutes(activeCourse.start_time);
    const eMin = timeToMinutes(activeCourse.end_time);
    const remainMins = eMin - currentMin;
    const originalIndex = courses.indexOf(activeCourse);
    const todayStr = getTodayDateStr();
    const isDone = isTaskCompleted(activeCourse, todayStr);
    const cat = activeCourse.category || "university";
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;

    cardContainer.innerHTML = `
      <div class="p-3.5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl border-2 border-indigo-500/80 shadow-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400/50 flex items-center justify-center text-lg text-white shrink-0 mt-0.5 shadow-md shadow-indigo-950">
            <i class="fa-solid ${meta.icon}"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                <span class="w-2 h-2 rounded-full bg-white mr-1.5 animate-ping"></span> ĐANG DIỄN RA
              </span>
              <span class="text-[11px] font-mono text-indigo-300 font-semibold">[${activeCourse.code}]</span>
            </div>
            <h3 class="font-extrabold text-sm sm:text-base text-white mt-1 leading-snug flex items-center gap-1.5 ${isDone ? 'line-through opacity-75' : ''}">
              ${activeCourse.name}
            </h3>
            <div class="flex items-center flex-wrap gap-2 text-xs text-slate-300 mt-1 font-medium">
              <span class="flex items-center"><i class="fa-solid fa-location-dot mr-1 text-indigo-400"></i> ${activeCourse.room || 'Ở nhà'}</span>
              <span>•</span>
              <span class="font-mono text-amber-300 font-bold">${activeCourse.start_time.slice(0,5)} – ${activeCourse.end_time.slice(0,5)}</span>
              <span>•</span>
              <span class="text-indigo-200 font-bold bg-white/10 px-2 py-0.2 rounded-md">⏳ Còn lại ${remainMins} phút</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0 sm:self-center">
          <button onclick="locateTodayOnCalendar()" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20" title="Định vị ngay đến ngày hôm nay trên lịch">
            <i class="fa-solid fa-crosshairs mr-1"></i> Định vị trên lịch
          </button>
          <button onclick="toggleTaskComplete(courses[${originalIndex}], '${todayStr}')" class="px-3.5 py-1.5 rounded-xl ${isDone ? 'bg-emerald-600 text-white' : 'bg-white hover:bg-emerald-50 text-slate-900'} text-xs font-extrabold transition shadow-md flex items-center space-x-1.5">
            <i class="fa-solid ${isDone ? 'fa-circle-check text-white' : 'fa-circle text-slate-300'}"></i>
            <span>${isDone ? 'Đã hoàn thành ✓' : 'Tích đã xong'}</span>
          </button>
        </div>
      </div>
    `;
  } else if (nextCourse) {
    const sMin = timeToMinutes(nextCourse.start_time);
    const startInMins = sMin - currentMin;
    const cat = nextCourse.category || "university";
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;

    cardContainer.innerHTML = `
      <div class="p-3.5 bg-slate-900 rounded-2xl border border-slate-700 shadow-sm text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-start space-x-3">
          <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg text-amber-400 shrink-0 mt-0.5">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⏳ HOẠT ĐỘNG KẾ TIẾP
              </span>
              <span class="text-xs text-slate-400 font-medium">Bắt đầu sau ${formatDuration(startInMins)}</span>
            </div>
            <h3 class="font-bold text-sm text-white mt-1">
              ${nextCourse.name} <span class="text-xs text-slate-400 font-mono font-normal">[${nextCourse.code}]</span>
            </h3>
            <div class="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span><i class="fa-solid fa-location-dot mr-1"></i> ${nextCourse.room || 'Ở nhà'}</span>
              <span>•</span>
              <span class="font-mono text-indigo-300 font-bold">${nextCourse.start_time.slice(0,5)} – ${nextCourse.end_time.slice(0,5)}</span>
            </div>
          </div>
        </div>

        <button onclick="locateTodayOnCalendar()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 shrink-0" title="Định vị ngay đến ngày hôm nay trên lịch">
          <i class="fa-solid fa-crosshairs mr-1 text-indigo-400"></i> Định vị trên lịch
        </button>
      </div>
    `;
  } else {
    cardContainer.innerHTML = `
      <div class="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-white flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg text-emerald-400">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Trạng thái hiện tại</span>
            <div class="text-xs font-bold text-white mt-0.5">Không có hoạt động nào trong khung giờ này hoặc đã hoàn tất lịch trình hôm nay.</div>
          </div>
        </div>
        <button onclick="resetTodayCompletions()" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition border border-white/10">
          <i class="fa-solid fa-rotate-left mr-1"></i> Đặt lại hôm nay
        </button>
      </div>
    `;
  }
}

// 4. Update Red "NOW" Line Position on Timelines
function updateNowIndicatorLine(currentMin, todayWeekday) {
  // Only show if between START_HOUR (05:00) and END_HOUR (23:00)
  if (currentMin < START_HOUR * 60 || currentMin > (END_HOUR + 1) * 60) {
    document.querySelectorAll(".now-indicator-line").forEach(el => el.remove());
    return;
  }

  const offsetFromStartHour = currentMin - (START_HOUR * 60);
  const topPx = (offsetFromStartHour / 60) * HOUR_HEIGHT;
  const now = new Date();
  const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // A. Day View Timeline Indicator
  const dayEventsCol = document.getElementById("day-timeline-events-col");
  if (dayEventsCol && selectedWeekday === todayWeekday) {
    let dayIndicator = document.getElementById("day-now-indicator");
    if (!dayIndicator) {
      dayIndicator = document.createElement("div");
      dayIndicator.id = "day-now-indicator";
      dayIndicator.className = "now-indicator-line";
      dayEventsCol.appendChild(dayIndicator);
    }
    dayIndicator.style.top = `${topPx}px`;
    dayIndicator.innerHTML = `
      <div class="now-indicator-badge">
        <span class="pulse-dot"></span>
        <span>${timeLabel} (Hiện tại)</span>
      </div>
    `;
  } else {
    const oldDayLine = document.getElementById("day-now-indicator");
    if (oldDayLine) oldDayLine.remove();
  }

  // B. Week View Column Indicator
  const weekDayCol = document.getElementById(`col-day-${todayWeekday}`);
  if (weekDayCol) {
    let weekIndicator = document.getElementById("week-now-indicator");
    if (!weekIndicator || weekIndicator.parentElement !== weekDayCol) {
      if (weekIndicator) weekIndicator.remove();
      weekIndicator = document.createElement("div");
      weekIndicator.id = "week-now-indicator";
      weekIndicator.className = "now-indicator-line";
      weekDayCol.appendChild(weekIndicator);
    }
    weekIndicator.style.top = `${topPx}px`;
    weekIndicator.innerHTML = `
      <div class="now-indicator-badge">
        <span class="pulse-dot"></span>
        <span>${timeLabel}</span>
      </div>
    `;
  }
}
