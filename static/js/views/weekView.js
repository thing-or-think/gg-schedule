// Week View Renderer & Controller with Dynamic Week Navigation

function buildTimelineBackground() {
  const hoursCol = document.getElementById("timeline-hours-col");
  if (!hoursCol) return;
  hoursCol.innerHTML = "";

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const timeStr = `${h.toString().padStart(2, '0')}:00`;
    const div = document.createElement("div");
    div.className = "time-slot-row flex items-start justify-center pt-1 text-[11px] text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800";
    div.innerText = timeStr;
    hoursCol.appendChild(div);
  }

  // Add hourly guide lines to each day column
  for (let wd = 0; wd < 7; wd++) {
    const dayCol = document.getElementById(`col-day-${wd}`);
    if (!dayCol) continue;
    dayCol.innerHTML = "";
    
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const slot = document.createElement("div");
      slot.className = "time-slot-row border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors";
      slot.title = `Bấm để thêm hoạt động vào ${weekdayNames[wd]} lúc ${h.toString().padStart(2, '0')}:00`;
      slot.onclick = () => openModalWithTime(wd, h);
      dayCol.appendChild(slot);
    }
  }
}

function prevWeek() {
  currentWeekOffset--;
  renderTimelineEvents();
  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
}

function nextWeek() {
  currentWeekOffset++;
  renderTimelineEvents();
  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
}

function goToCurrentWeek() {
  currentWeekOffset = 0;
  renderTimelineEvents();
  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
  showToast(`Đang xem ${getWeekRangeLabel(0)}`);
}

function renderTimelineEvents() {
  // 1. Update Week Title Label
  const titleDisplay = document.getElementById("week-title-display");
  if (titleDisplay) {
    titleDisplay.innerText = getWeekRangeLabel(currentWeekOffset);
  }

  const weekDays = getWeekDates(currentWeekOffset);
  const todayStr = typeof getTodayDateStr === "function" ? getTodayDateStr() : "";
  const now = new Date();
  const todayWd = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // 2. Render Dynamic Header for each weekday column
  const daySubtitles = [
    "Ở lại trường cả ngày",
    "Mạng MT (07h-09h40)",
    "Tự học 100% • Bài lớn",
    "Thu thập YC (10h-12h40)",
    "AI & CSDL (2 ca học)",
    "Tự học & Portfolio",
    "Review tuần & LeetCode"
  ];

  weekDays.forEach((dayInfo, wd) => {
    const headerEl = document.getElementById(`col-header-day-${wd}`);
    if (!headerEl) return;

    const isToday = dayInfo.dateStr === todayStr;
    const isPast = dayInfo.dateStr < todayStr;

    headerEl.onclick = () => zoomIntoDay(wd, currentWeekOffset);
    headerEl.title = `Xem chi tiết ${weekdayNames[wd]} (${dayInfo.formattedFull})`;

    headerEl.className = `py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-700 flex flex-col items-center cursor-pointer transition ${
      isToday
        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/80 z-10'
        : (wd === 5 || wd === 6 ? 'bg-rose-50/20 dark:bg-rose-950/20 hover:bg-rose-50/40 dark:hover:bg-rose-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50')
    }`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="${isToday ? 'text-indigo-600 dark:text-indigo-400 font-black' : (wd === 6 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-800 dark:text-slate-200 font-extrabold')}">
          ${weekdayNames[wd]}
        </span>
        <span class="text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
          isToday 
            ? 'bg-indigo-600 text-white shadow-2xs' 
            : 'bg-slate-200/70 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
        }">
          ${dayInfo.formattedShort}
        </span>
      </div>
      <span class="text-[9.5px] font-normal truncate max-w-[110px] mt-0.5 ${
        isToday ? 'text-indigo-600 dark:text-indigo-300 font-semibold' : 'text-slate-500 dark:text-slate-400'
      }">
        ${daySubtitles[wd]}
      </span>
    `;
  });

  // 3. Clear old event cards
  document.querySelectorAll("#timeline-body .event-card").forEach(el => el.remove());

  // 4. Render Event Cards for the selected week
  courses.forEach((c, index) => {
    const cat = c.category || "university";
    if (currentFilter !== "all" && cat !== currentFilter) return;

    const dayCol = document.getElementById(`col-day-${c.weekday}`);
    if (!dayCol) return;

    const taskDateStr = weekDays[c.weekday].dateStr;
    const isToday = taskDateStr === todayStr;

    const startMin = timeToMinutes(c.start_time);
    const endMin = timeToMinutes(c.end_time);
    const durationMin = Math.max(endMin - startMin, 25);

    // Calculate exact vertical position and height in px
    const offsetFromStartHour = startMin - (START_HOUR * 60);
    const topPx = (offsetFromStartHour / 60) * HOUR_HEIGHT;
    const heightPx = (durationMin / 60) * HOUR_HEIGHT - 3;

    const meta = CATEGORY_META[cat] || CATEGORY_META.university;
    const isDone = typeof isTaskCompleted === "function" && isTaskCompleted(c, taskDateStr);
    const isActive = isToday && currentMin >= startMin && currentMin < endMin;
    const val = typeof validateTaskCheckWindow === "function" ? validateTaskCheckWindow(c, taskDateStr) : { isValid: true };

    let btnTitle = "Bấm để tích đã làm xong";
    let btnIcon = "fa-circle text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px]";

    if (isDone) {
      btnTitle = `Đã hoàn thành vào ${taskDateStr}! Bấm để bỏ đánh dấu`;
      btnIcon = "fa-circle-check text-emerald-600 text-xs";
    } else if (!val.isValid) {
      btnTitle = val.reason;
      btnIcon = val.status === "too_late" ? "fa-lock text-slate-300 dark:text-slate-600 text-[10px]" : "fa-clock text-slate-300 dark:text-slate-500 hover:text-amber-500 text-[10px]";
    } else {
      btnTitle = `Khung giờ điểm danh hợp lệ (${val.windowStartStr} - ${val.windowEndStr}). Bấm để hoàn thành!`;
      btnIcon = "fa-circle text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-125 text-[10px] animate-pulse";
    }

    const card = document.createElement("div");
    card.className = `event-card absolute left-1 right-1 rounded-xl p-1.5 border shadow-xs ${meta.bg} ${meta.cardBorder} cursor-pointer flex flex-col justify-between overflow-hidden z-10 ${
      isDone ? 'task-completed' : ''
    } ${isActive ? 'activity-active-glow' : ''}`;
    card.style.top = `${topPx}px`;
    card.style.height = `${Math.max(heightPx, 32)}px`;

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-1">
          <div class="flex items-start space-x-1 min-w-0">
            <button onclick="event.stopPropagation(); toggleTaskComplete(courses[${index}], '${taskDateStr}')" class="p-0.2 hover:scale-125 transition shrink-0 mt-0.5" title="${btnTitle}">
              <i class="fa-solid ${btnIcon}"></i>
            </button>
            <span class="font-bold text-[11px] leading-tight line-clamp-2 task-title ${isActive ? 'text-indigo-950 dark:text-indigo-100 font-black' : ''}">${c.name}</span>
          </div>
          <div class="opacity-0 hover:opacity-100 flex space-x-1 shrink-0 bg-white/90 dark:bg-slate-800/90 p-0.5 rounded shadow-2xs">
            <button onclick="event.stopPropagation(); editCourse(${index})" class="text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5" title="Sửa">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="event.stopPropagation(); deleteCourse(${index})" class="text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 p-0.5" title="Xóa">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center space-x-1 mt-0.5 text-[10px]">
          <span class="font-mono font-bold">[${c.code}]</span>
          <span class="px-1 rounded bg-white/80 dark:bg-slate-800/80 font-medium truncate">${c.room || 'Ở nhà'}</span>
          ${isActive ? '<span class="text-[9px] px-1 bg-rose-500 text-white rounded font-bold animate-pulse">⚡ LIVE</span>' : ''}
        </div>
      </div>
      <div class="text-[9.5px] font-mono opacity-80 mt-auto pt-0.5 flex justify-between items-center border-t border-black/5 dark:border-white/10">
        <span>${c.start_time.slice(0,5)} – ${c.end_time.slice(0,5)}</span>
        <span class="px-1 py-0.2 rounded ${meta.badge} font-bold font-sans text-[9px]">${formatDuration(endMin - startMin)}</span>
      </div>
    `;

    card.onclick = () => editCourse(index);
    dayCol.appendChild(card);
  });
}
