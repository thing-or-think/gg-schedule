// Day View Renderer & Controller with Dynamic Week-Date Integration

function buildDayTimelineBackground() {
  const hoursCol = document.getElementById("day-timeline-hours-col");
  const eventsCol = document.getElementById("day-timeline-events-col");
  if (!hoursCol || !eventsCol) return;

  hoursCol.innerHTML = "";
  eventsCol.innerHTML = "";

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const timeStr = `${h.toString().padStart(2, '0')}:00`;
    const hourDiv = document.createElement("div");
    hourDiv.className = "time-slot-row flex items-start justify-center pt-1 text-[11px] text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800";
    hourDiv.innerText = timeStr;
    hoursCol.appendChild(hourDiv);

    const slot = document.createElement("div");
    slot.className = "time-slot-row border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors";
    slot.title = `Bấm để thêm hoạt động vào ${weekdayNames[selectedWeekday]} lúc ${timeStr}`;
    slot.onclick = () => openModalWithTime(selectedWeekday, h);
    eventsCol.appendChild(slot);
  }
}

function selectDay(wd) {
  selectedWeekday = wd;
  buildDayTimelineBackground();
  renderDayView();
  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
}

function prevDay() {
  if (selectedWeekday === 0) {
    selectedWeekday = 6;
    currentWeekOffset--;
  } else {
    selectedWeekday--;
  }
  buildDayTimelineBackground();
  renderDayView();
  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
}

function nextDay() {
  if (selectedWeekday === 6) {
    selectedWeekday = 0;
    currentWeekOffset++;
  } else {
    selectedWeekday++;
  }
  buildDayTimelineBackground();
  renderDayView();
  if (typeof updateProductivityUI === "function") {
    updateProductivityUI();
  }
}

function openModalForSelectedDay() {
  openModal(-1);
  document.getElementById("course-weekday").value = selectedWeekday;
}

function zoomIntoDay(wd, weekOffset = 0) {
  currentWeekOffset = weekOffset;
  selectedWeekday = wd;
  switchTab("day");
  const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : [];
  const dayInfo = weekDays[wd];
  const dateFormatted = dayInfo ? dayInfo.formattedFull : "";
  showToast(`Đang xem chi tiết ${weekdayNames[wd]}${dateFormatted ? ', ngày ' + dateFormatted : ''}`);
}

function zoomIntoDate(year, month, day, weekday = null) {
  const targetDate = new Date(year, month, day);
  const currentMonday = getMondayOfWeek(0);
  
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const targetMonday = new Date(targetDate);
  targetMonday.setDate(targetDate.getDate() + diffToMonday);
  targetMonday.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetMonday - currentMonday) / (1000 * 60 * 60 * 24));
  currentWeekOffset = Math.round(diffDays / 7);
  selectedWeekday = weekday !== null ? weekday : (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  currentMonth = month;
  currentYear = year;

  switchTab("day");
  showToast(`Đang xem chi tiết ${weekdayNames[selectedWeekday]}, ngày ${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`);
}

function locateTodayOnCalendar() {
  const now = new Date();
  const todayWd = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  currentWeekOffset = 0;
  selectedWeekday = todayWd;
  currentMonth = now.getMonth();
  currentYear = year;

  switchTab("day");

  setTimeout(() => {
    scrollToNowIndicator();
  }, 100);

  showToast(`📍 Định vị: ${weekdayNames[todayWd]}, ngày ${day}/${month}/${year}`);
}

function scrollToNowIndicator() {
  const dayIndicator = document.getElementById("day-now-indicator");
  if (dayIndicator) {
    dayIndicator.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const activeCard = document.querySelector("#day-timeline-events-col .activity-active-glow");
  if (activeCard) {
    activeCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function renderDayView() {
  const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : [];
  const selectedDayInfo = weekDays[selectedWeekday];
  const selectedDateStr = selectedDayInfo ? selectedDayInfo.dateStr : getTodayDateStr();
  const todayStr = getTodayDateStr();

  // 1. Render day selector pills with completion status for the exact date
  const pillsContainer = document.getElementById("day-selector-pills");
  if (pillsContainer) {
    pillsContainer.innerHTML = "";
    weekdayNames.forEach((name, wd) => {
      const dayInfo = weekDays[wd];
      const dayDateStr = dayInfo ? dayInfo.dateStr : todayStr;
      const dayCourses = courses.filter(c => c.weekday === wd);
      const isSelected = wd === selectedWeekday;
      const completedCount = dayCourses.filter(c => typeof isTaskCompleted === "function" && isTaskCompleted(c, dayDateStr)).length;
      
      const btn = document.createElement("button");
      btn.onclick = () => selectDay(wd);
      btn.className = `flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
        isSelected
          ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-800 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300'
      }`;
      
      const isAllDone = dayCourses.length > 0 && completedCount === dayCourses.length;
      btn.innerHTML = `
        <span class="flex items-center gap-1 truncate">
          ${isAllDone ? '<i class="fa-solid fa-circle-check text-emerald-400 text-[11px]"></i>' : ''}
          <span>${name}</span>
          <span class="text-[9px] font-mono opacity-70">(${dayInfo ? dayInfo.formattedShort : ''})</span>
        </span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
          isSelected 
            ? (isAllDone ? 'bg-emerald-500 text-white' : 'bg-indigo-600 dark:bg-indigo-700 text-white') 
            : (isAllDone ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300')
        }">${completedCount}/${dayCourses.length}</span>
      `;
      pillsContainer.appendChild(btn);
    });
  }

  // 2. Render Day Theme Banner with Completion Progress for selected date
  const themeBanner = document.getElementById("day-theme-banner");
  if (themeBanner) {
    const theme = DAY_THEMES[selectedWeekday] || DAY_THEMES[0];
    const dayCourses = courses.filter(c => c.weekday === selectedWeekday);
    let totalDayMins = 0;
    let completedDayMins = 0;
    const catMins = { university: 0, english: 0, code: 0, project: 0, healthy: 0, life: 0, leisure: 0 };
    let completedCount = 0;

    dayCourses.forEach(c => {
      const s = timeToMinutes(c.start_time);
      const e = timeToMinutes(c.end_time);
      const dur = Math.max(e - s, 0);
      totalDayMins += dur;
      const cat = c.category || "university";
      if (catMins[cat] !== undefined) catMins[cat] += dur;

      if (typeof isTaskCompleted === "function" && isTaskCompleted(c, selectedDateStr)) {
        completedCount++;
        completedDayMins += dur;
      }
    });

    const percent = dayCourses.length > 0 ? Math.round((completedCount / dayCourses.length) * 100) : 0;

    themeBanner.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="p-2 rounded-xl bg-white/10 text-lg ${theme.color}"><i class="fa-solid ${theme.icon}"></i></span>
            <div>
              <div class="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <span>Lộ trình trọng tâm</span>
                <span class="text-white/70 font-mono text-[10px] font-normal">(${selectedDayInfo ? selectedDayInfo.formattedFull : selectedDateStr})</span>
              </div>
              <h3 class="font-extrabold text-base text-white">${theme.title}</h3>
            </div>
          </div>
          <p class="text-xs text-slate-300 max-w-2xl leading-relaxed pt-1">${theme.desc}</p>
        </div>
        <div class="flex items-center flex-wrap gap-2 shrink-0 bg-white/5 p-2.5 rounded-xl border border-white/10">
          <div class="text-center px-2.5 py-1">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Hoàn thành</div>
            <div class="text-sm font-extrabold text-emerald-400 font-mono">${completedCount}/${dayCourses.length} (${percent}%)</div>
          </div>
          <div class="w-px h-7 bg-white/15"></div>
          <div class="text-center px-2.5 py-1">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Thời lượng</div>
            <div class="text-sm font-extrabold text-indigo-300">${formatDuration(totalDayMins)}</div>
          </div>
          <div class="w-px h-7 bg-white/15"></div>
          <div class="text-center px-2.5 py-1">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Tiếng Anh</div>
            <div class="text-sm font-extrabold text-amber-300">${formatDuration(catMins.english)}</div>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Render Day Hourly Timeline Cards
  const dayEventsCol = document.getElementById("day-timeline-events-col");
  if (dayEventsCol) {
    dayEventsCol.querySelectorAll(".event-card").forEach(el => el.remove());
    const filteredDayCourses = courses.filter(c => c.weekday === selectedWeekday && (currentFilter === "all" || (c.category || "university") === currentFilter));

    const now = new Date();
    const isToday = selectedDateStr === todayStr;
    const currentMin = now.getHours() * 60 + now.getMinutes();

    filteredDayCourses.forEach((c) => {
      const originalIndex = courses.indexOf(c);
      const startMin = timeToMinutes(c.start_time);
      const endMin = timeToMinutes(c.end_time);
      const durationMin = Math.max(endMin - startMin, 25);

      const offsetFromStartHour = startMin - (START_HOUR * 60);
      const topPx = (offsetFromStartHour / 60) * HOUR_HEIGHT;
      const heightPx = (durationMin / 60) * HOUR_HEIGHT - 3;

      const cat = c.category || "university";
      const meta = CATEGORY_META[cat] || CATEGORY_META.university;
      const isDone = typeof isTaskCompleted === "function" && isTaskCompleted(c, selectedDateStr);
      const isActive = isToday && currentMin >= startMin && currentMin < endMin;

      const card = document.createElement("div");
      card.className = `event-card absolute left-2 right-2 rounded-xl p-2 border shadow-xs ${meta.bg} ${meta.cardBorder} cursor-pointer flex flex-col justify-between overflow-hidden z-10 ${
        isDone ? 'task-completed' : ''
      } ${isActive ? 'activity-active-glow' : ''}`;
      card.style.top = `${topPx}px`;
      card.style.height = `${Math.max(heightPx, 36)}px`;

      const val = typeof validateTaskCheckWindow === "function" ? validateTaskCheckWindow(c, selectedDateStr) : { isValid: true };
      let btnTitle = "Bấm để tích đã làm xong";
      let btnIcon = "fa-circle text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs";

      if (isDone) {
        btnTitle = `Đã hoàn thành (${selectedDateStr})! Bấm để bỏ đánh dấu`;
        btnIcon = "fa-circle-check text-emerald-600 text-sm";
      } else if (!val.isValid) {
        btnTitle = val.reason;
        btnIcon = val.status === "too_late" ? "fa-lock text-slate-300 dark:text-slate-600 text-xs" : "fa-clock text-slate-300 dark:text-slate-500 hover:text-amber-500 text-xs";
      } else {
        btnTitle = `Khung giờ điểm danh hợp lệ (${val.windowStartStr} - ${val.windowEndStr}). Bấm để hoàn thành!`;
        btnIcon = "fa-circle text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-125 text-xs animate-pulse";
      }

      card.innerHTML = `
        <div class="flex items-start justify-between gap-1">
          <div class="flex items-center space-x-1.5 truncate">
            <button onclick="event.stopPropagation(); toggleTaskComplete(courses[${originalIndex}], '${selectedDateStr}')" class="p-0.5 rounded-full hover:scale-110 transition shrink-0" title="${btnTitle}">
              <i class="fa-solid ${btnIcon}"></i>
            </button>
            <span class="font-extrabold text-xs leading-tight task-title truncate ${isActive ? 'text-indigo-950 dark:text-indigo-100 font-black' : ''}">${c.name}</span>
            <span class="ml-1 text-[10px] font-mono px-1 rounded bg-black/5 dark:bg-white/10 font-bold shrink-0">[${c.code}]</span>
          </div>
          <div class="opacity-0 hover:opacity-100 flex space-x-1 shrink-0 bg-white/90 dark:bg-slate-800/90 p-0.5 rounded-md shadow-2xs">
            <button onclick="event.stopPropagation(); editCourse(${originalIndex})" class="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5" title="Sửa">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="event.stopPropagation(); deleteCourse(${originalIndex})" class="text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 p-0.5" title="Xóa">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between text-[10.5px] mt-auto pt-1 font-medium border-t border-black/5 dark:border-white/10">
          <span class="text-slate-600 dark:text-slate-300 flex items-center truncate">
            <i class="fa-solid fa-location-dot mr-1 text-[10px] opacity-70"></i> ${c.room || 'Ở nhà'} ${c.class ? '• ' + c.class : ''}
          </span>
          <span class="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 ml-2">
            ${c.start_time.slice(0,5)} – ${c.end_time.slice(0,5)} (${formatDuration(endMin - startMin)})
          </span>
        </div>
      `;

      card.onclick = () => editCourse(originalIndex);
      dayEventsCol.appendChild(card);
    });
  }

  // 4. Render Day Agenda Stream (Right column)
  const agendaStream = document.getElementById("day-agenda-stream");
  const agendaBadge = document.getElementById("day-agenda-count-badge");
  if (agendaStream) {
    agendaStream.innerHTML = "";
    const dayCourses = courses.filter(c => c.weekday === selectedWeekday && (currentFilter === "all" || (c.category || "university") === currentFilter));
    dayCourses.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    const completedCount = dayCourses.filter(c => typeof isTaskCompleted === "function" && isTaskCompleted(c, selectedDateStr)).length;
    if (agendaBadge) agendaBadge.innerText = `${completedCount}/${dayCourses.length} đã xong (${selectedDateStr})`;

    if (dayCourses.length === 0) {
      agendaStream.innerHTML = `
        <div class="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
          <i class="fa-regular fa-calendar-xmark text-3xl"></i>
          <p class="text-xs">Không có hoạt động nào trong ngày này với bộ lọc hiện tại.</p>
        </div>
      `;
    } else {
      dayCourses.forEach((c) => {
        const originalIndex = courses.indexOf(c);
        const cat = c.category || "university";
        const meta = CATEGORY_META[cat] || CATEGORY_META.university;
        const isDone = typeof isTaskCompleted === "function" && isTaskCompleted(c, selectedDateStr);
        const val = typeof validateTaskCheckWindow === "function" ? validateTaskCheckWindow(c, selectedDateStr) : { isValid: true };

        let btnTitle = "Bấm để tích đã làm xong";
        let btnIcon = "fa-circle text-slate-300 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-base";

        if (isDone) {
          btnTitle = `Đã hoàn thành (${selectedDateStr})! Bấm để bỏ đánh dấu`;
          btnIcon = "fa-circle-check text-emerald-600 text-lg";
        } else if (!val.isValid) {
          btnTitle = val.reason;
          btnIcon = val.status === "too_late" ? "fa-lock text-slate-300 dark:text-slate-600 text-base" : "fa-clock text-slate-300 dark:text-slate-500 hover:text-amber-500 text-base";
        } else {
          btnTitle = `Khung giờ điểm danh hợp lệ (${val.windowStartStr} - ${val.windowEndStr}). Bấm để hoàn thành!`;
          btnIcon = "fa-circle text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-125 text-base animate-pulse";
        }

        const itemDiv = document.createElement("div");
        itemDiv.className = `p-3 rounded-2xl border ${meta.bg} ${meta.cardBorder} hover:shadow-sm transition group cursor-pointer ${
          isDone ? 'task-completed' : ''
        }`;
        itemDiv.onclick = () => editCourse(originalIndex);

        itemDiv.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center space-x-2.5">
              <button onclick="event.stopPropagation(); toggleTaskComplete(courses[${originalIndex}], '${selectedDateStr}')" class="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition shrink-0" title="${btnTitle}">
                <i class="fa-solid ${btnIcon}"></i>
              </button>
              <div>
                <h4 class="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight task-title flex items-center gap-1.5">
                  <span>${c.name}</span>
                  ${isDone ? '<span class="text-[9.5px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-semibold no-underline">✓ Xong</span>' : ''}
                </h4>
                <span class="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono font-semibold">[${c.code}]</span>
              </div>
            </div>
            <div class="opacity-0 group-hover:opacity-100 flex items-center space-x-1 shrink-0 transition">
              <button onclick="event.stopPropagation(); editCourse(${originalIndex})" class="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-white dark:hover:bg-slate-800 transition" title="Sửa">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="event.stopPropagation(); deleteCourse(${originalIndex})" class="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-white dark:hover:bg-slate-800 transition" title="Xóa">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          
          <div class="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
            <div class="flex items-center space-x-2 truncate">
              <span class="bg-white/80 dark:bg-slate-800/90 px-2 py-0.5 rounded-md font-medium truncate flex items-center">
                <i class="fa-solid fa-location-dot mr-1 text-[9px] text-slate-400"></i> ${c.room || 'Ở nhà'}
              </span>
              ${c.class ? `<span class="text-slate-500 dark:text-slate-400 truncate text-[10px]">${c.class}</span>` : ''}
            </div>
            <div class="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 ml-2 bg-white/90 dark:bg-slate-800/90 px-2 py-0.5 rounded-md border border-black/5 dark:border-slate-700">
              ${c.start_time.slice(0,5)} – ${c.end_time.slice(0,5)}
            </div>
          </div>
        `;
        agendaStream.appendChild(itemDiv);
      });
    }
  }
}
