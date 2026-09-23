// List View Renderer & Controller with Dynamic Week-Date Integration

function renderListView() {
  const tbody = document.getElementById("list-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const weekDays = typeof getWeekDates === "function" ? getWeekDates(currentWeekOffset) : null;
  const filteredCourses = courses.filter(c => currentFilter === "all" || (c.category || "university") === currentFilter);

  filteredCourses.forEach((c) => {
    const originalIndex = courses.indexOf(c);
    const targetDateStr = weekDays && weekDays[c.weekday] ? weekDays[c.weekday].dateStr : getTodayDateStr();
    const formattedShort = weekDays && weekDays[c.weekday] ? weekDays[c.weekday].formattedShort : "";

    const startMin = timeToMinutes(c.start_time);
    const endMin = timeToMinutes(c.end_time);
    const duration = formatDuration(endMin - startMin);
    const cat = c.category || "university";
    const meta = CATEGORY_META[cat] || CATEGORY_META.university;
    const isDone = typeof isTaskCompleted === "function" && isTaskCompleted(c, targetDateStr);
    const val = typeof validateTaskCheckWindow === "function" ? validateTaskCheckWindow(c, targetDateStr) : { isValid: true };

    let btnTitle = "Đánh dấu đã hoàn thành";
    let btnIcon = "fa-circle text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm";

    if (isDone) {
      btnTitle = `Đã hoàn thành (${targetDateStr})! Bấm để bỏ đánh dấu`;
      btnIcon = "fa-circle-check text-emerald-600 text-base";
    } else if (!val.isValid) {
      btnTitle = val.reason;
      btnIcon = val.status === "too_late" ? "fa-lock text-slate-300 dark:text-slate-600 text-sm" : "fa-clock text-slate-300 dark:text-slate-500 hover:text-amber-500 text-sm";
    } else {
      btnTitle = `Khung giờ điểm danh hợp lệ (${val.windowStartStr} - ${val.windowEndStr}). Bấm để hoàn thành!`;
      btnIcon = "fa-circle text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-125 text-sm animate-pulse";
    }

    const tr = document.createElement("tr");
    tr.className = `hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${isDone ? 'task-completed bg-slate-50/50 dark:bg-slate-900/50' : ''}`;
    tr.innerHTML = `
      <td class="py-3 px-3 text-center">
        <button onclick="toggleTaskComplete(courses[${originalIndex}], '${targetDateStr}')" class="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition" title="${btnTitle}">
          <i class="fa-solid ${btnIcon}"></i>
        </button>
      </td>
      <td class="py-3 px-4">
        <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${meta.badge}">
          <i class="fa-solid ${meta.icon} mr-1"></i> ${meta.name}
        </span>
      </td>
      <td class="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">${c.code}</td>
      <td class="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 task-title">
        <span>${c.name}</span>
        ${isDone ? `<span class="ml-2 text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-semibold no-underline">✓ Xong (${targetDateStr})</span>` : ''}
      </td>
      <td class="py-3 px-4 text-slate-500 dark:text-slate-400">${c.class || '—'}</td>
      <td class="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
        <span>${weekdayNames[c.weekday]}</span>
        ${formattedShort ? `<span class="text-[10px] font-mono text-slate-400 ml-1">(${formattedShort})</span>` : ''}
      </td>
      <td class="py-3 px-4 font-mono text-slate-800 dark:text-slate-200 font-semibold">${c.start_time.slice(0,5)} – ${c.end_time.slice(0,5)}</td>
      <td class="py-3 px-4"><span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300">${duration}</span></td>
      <td class="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300"><span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">${c.room || 'Ở nhà'}</span></td>
      <td class="py-3 px-4 text-right space-x-1">
        <button onclick="editCourse(${originalIndex})" class="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition" title="Chỉnh sửa">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="deleteCourse(${originalIndex})" class="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition" title="Xóa">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
