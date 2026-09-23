// Month View Renderer & Controller with Date-Jumping Integration

function jumpToDate(year, month, day, weekday) {
  const targetDate = new Date(year, month, day);
  const currentMonday = getMondayOfWeek(0);
  
  // Calculate target Monday
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const targetMonday = new Date(targetDate);
  targetMonday.setDate(targetDate.getDate() + diffToMonday);
  targetMonday.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetMonday - currentMonday) / (1000 * 60 * 60 * 24));
  currentWeekOffset = Math.round(diffDays / 7);
  selectedWeekday = weekday;

  switchTab("day");
  showToast(`Đang xem chi tiết ${weekdayNames[weekday]}, ngày ${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`);
}

function renderMonthView() {
  const titleDisplay = document.getElementById("month-title-display");
  if (titleDisplay) {
    titleDisplay.innerText = `${monthNames[currentMonth]} / ${currentYear}`;
  }

  // Update semester quick buttons
  document.querySelectorAll(".month-quick-btn").forEach((btn, idx) => {
    const m = 8 + idx; // 8=Sept, 9=Oct, 10=Nov, 11=Dec
    if (m === currentMonth && currentYear === 2026) {
      btn.className = "month-quick-btn px-2.5 py-1 text-xs font-bold rounded-lg transition bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs";
    } else {
      btn.className = "month-quick-btn px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-lg hover:text-slate-900 dark:hover:text-white transition";
    }
  });

  const gridCells = document.getElementById("month-grid-cells");
  if (!gridCells) return;
  gridCells.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Convert JS getDay() (0=Sun, 1=Mon, ..., 6=Sat) to Monday-start (0=Mon, ..., 6=Sun)
  let startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayDate = today.getDate();

  // 1. Render Padding Days from Previous Month
  for (let i = startingDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevDate = new Date(prevYearVal, prevMonthIdx, d);
    const prevWd = prevDate.getDay() === 0 ? 6 : prevDate.getDay() - 1;

    const cell = document.createElement("div");
    cell.className = "min-h-[110px] p-2 bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 opacity-60 flex flex-col justify-between cursor-pointer hover:opacity-100 transition";
    cell.onclick = () => jumpToDate(prevYearVal, prevMonthIdx, d, prevWd);
    cell.innerHTML = `<span class="text-xs font-bold font-mono">${d}</span>`;
    gridCells.appendChild(cell);
  }

  // 2. Render Actual Days of Current Month
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    const dayWd = cellDate.getDay() === 0 ? 6 : cellDate.getDay() - 1;
    const isToday = isCurrentMonth && d === todayDate;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const dayCourses = courses.filter(c => c.weekday === dayWd && (currentFilter === "all" || (c.category || "university") === currentFilter));
    dayCourses.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    const completedCount = dayCourses.filter(c => typeof isTaskCompleted === "function" && isTaskCompleted(c, dateStr)).length;
    const isAllDone = dayCourses.length > 0 && completedCount === dayCourses.length;

    const cell = document.createElement("div");
    cell.className = `min-h-[115px] p-2 bg-white dark:bg-slate-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/30 transition-colors flex flex-col justify-between cursor-pointer group ${
      isToday ? 'ring-2 ring-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20' : ''
    }`;
    cell.onclick = () => jumpToDate(currentYear, currentMonth, d, dayWd);

    // Header: Day number + Today badge + Event count
    let cellHtml = `
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center space-x-1">
            <span class="text-xs font-extrabold font-mono px-1.5 py-0.5 rounded-lg ${
              isToday ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            }">${d}</span>
            ${isAllDone ? '<i class="fa-solid fa-circle-check text-emerald-500 text-[10px]" title="Đã hoàn thành tất cả!"></i>' : ''}
          </div>
          <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-sans">${weekdayNames[dayWd].slice(0, 4)}</span>
        </div>
        <div class="space-y-1">
      `;

    // Render top 3 event badges
    const previewEvents = dayCourses.slice(0, 3);
    previewEvents.forEach(c => {
      const cat = c.category || "university";
      const meta = CATEGORY_META[cat] || CATEGORY_META.university;
      const doneThisDay = typeof isTaskCompleted === "function" && isTaskCompleted(c, dateStr);

      cellHtml += `
        <div class="truncate text-[10px] px-1.5 py-0.5 rounded-md ${meta.badge} font-semibold flex items-center justify-between ${doneThisDay ? 'opacity-50 line-through' : ''}" title="${c.name} (${c.start_time.slice(0,5)})">
          <span class="truncate">${c.name}</span>
          <span class="font-mono text-[9px] ml-1 shrink-0 opacity-80">${c.start_time.slice(0,5)}</span>
        </div>
      `;
    });

    if (dayCourses.length > 3) {
      cellHtml += `
        <div class="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1 py-0.2 rounded text-center">
          +${dayCourses.length - 3} hoạt động khác
        </div>
      `;
    }

    cellHtml += `
        </div>
      </div>
      <div class="text-[9.5px] font-medium text-slate-400 dark:text-slate-500 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-80 group-hover:opacity-100">
        <span>${completedCount}/${dayCourses.length} xong</span>
        <span class="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform"><i class="fa-solid fa-arrow-right text-[8px]"></i></span>
      </div>
    `;

    cell.innerHTML = cellHtml;
    gridCells.appendChild(cell);
  }

  // 3. Render Padding Days for Next Month
  const totalCells = startingDay + daysInMonth;
  const nextMonthPadding = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= nextMonthPadding; d++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextDate = new Date(nextYearVal, nextMonthIdx, d);
    const nextWd = nextDate.getDay() === 0 ? 6 : nextDate.getDay() - 1;

    const cell = document.createElement("div");
    cell.className = "min-h-[110px] p-2 bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 opacity-60 flex flex-col justify-between cursor-pointer hover:opacity-100 transition";
    cell.onclick = () => jumpToDate(nextYearVal, nextMonthIdx, d, nextWd);
    cell.innerHTML = `<span class="text-xs font-bold font-mono">${d}</span>`;
    gridCells.appendChild(cell);
  }
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderMonthView();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderMonthView();
}

function setMonth(m) {
  currentMonth = m;
  currentYear = 2026;
  renderMonthView();
}

function goToCurrentMonth() {
  const now = new Date();
  currentMonth = now.getMonth();
  currentYear = now.getFullYear();
  renderMonthView();
  showToast(`Đang xem ${monthNames[currentMonth]} / ${currentYear}`);
}
