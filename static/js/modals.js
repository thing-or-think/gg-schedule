// Modals, Forms and Actions Controller

function togglePresetMenu() {
  const menu = document.getElementById("preset-dropdown");
  if (menu) menu.classList.toggle("hidden");
}

function onCategoryChange(cat) {
  const codeInput = document.getElementById("course-code");
  const roomInput = document.getElementById("course-room");
  const nameInput = document.getElementById("course-name");

  if (cat === "university") {
    if (!codeInput.value || ["ENG", "CODE", "PROJ", "RUN", "MEAL", "REST"].includes(codeInput.value)) codeInput.value = "INT";
    if (!roomInput.value || ["Ở nhà", "Công viên", "Bếp nhà", "Phòng ngủ"].includes(roomInput.value)) roomInput.value = "207-B";
  } else if (cat === "healthy") {
    if (!codeInput.value || codeInput.value.startsWith("INT")) codeInput.value = "RUN";
    roomInput.value = "Công viên / Quanh nhà";
    if (!nameInput.value) nameInput.value = "Chạy bộ sáng 5km & Giãn cơ";
  } else if (cat === "english") {
    if (!codeInput.value || codeInput.value.startsWith("INT")) codeInput.value = "ENG";
    roomInput.value = "Ở nhà";
    if (!nameInput.value) nameInput.value = "Học Tiếng Anh";
  } else if (cat === "code") {
    if (!codeInput.value || codeInput.value.startsWith("INT")) codeInput.value = "CODE";
    roomInput.value = "Ở nhà";
    if (!nameInput.value) nameInput.value = "Luyện Code & Kỹ năng";
  } else if (cat === "project") {
    if (!codeInput.value || codeInput.value.startsWith("INT")) codeInput.value = "PROJ";
    roomInput.value = "Ở nhà";
    if (!nameInput.value) nameInput.value = "Dự án: Sprint Phát triển Tính Năng";
  } else if (cat === "life") {
    if (!codeInput.value || codeInput.value.startsWith("INT")) codeInput.value = "MEAL";
    roomInput.value = "Bếp nhà";
    if (!nameInput.value) nameInput.value = "Nấu cơm & Ăn uống";
  } else if (cat === "leisure") {
    if (!codeInput.value || codeInput.value.startsWith("INT")) codeInput.value = "REST";
    roomInput.value = "Ở nhà";
    if (!nameInput.value) nameInput.value = "Giải trí & Thư giãn";
  }
}

function calculateDuration() {
  const startVal = document.getElementById("course-start-time")?.value;
  const endVal = document.getElementById("course-end-time")?.value;
  if (!startVal || !endVal) return;

  const sMin = timeToMinutes(startVal);
  const eMin = timeToMinutes(endVal);
  const badge = document.getElementById("duration-badge");
  if (!badge) return;

  if (eMin <= sMin) {
    badge.innerText = "Giờ kết thúc phải sau giờ bắt đầu!";
    badge.className = "text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200";
  } else {
    badge.innerText = `Thời lượng: ${formatDuration(eMin - sMin)}`;
    badge.className = "text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200";
  }
}

function setPresetDuration(mins) {
  const startVal = document.getElementById("course-start-time")?.value || "05:00";
  const sMin = timeToMinutes(startVal);
  const eMin = sMin + mins;
  
  const endH = Math.floor(eMin / 60) % 24;
  const endM = eMin % 60;
  const endInput = document.getElementById("course-end-time");
  if (endInput) {
    endInput.value = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  }
  calculateDuration();
}

function openModal(editIndex = -1) {
  const modal = document.getElementById("course-modal");
  const editInput = document.getElementById("edit-index");
  const title = document.getElementById("modal-title");
  if (!modal || !editInput || !title) return;

  editInput.value = editIndex;
  if (editIndex >= 0) {
    title.innerHTML = `<i class="fa-solid fa-pen-to-square text-indigo-600"></i> <span>Chỉnh sửa hoạt động</span>`;
    const c = courses[editIndex];
    document.getElementById("course-code").value = c.code;
    document.getElementById("course-name").value = c.name;
    document.getElementById("course-class").value = c.class || "";
    document.getElementById("course-room").value = c.room || "";
    document.getElementById("course-weekday").value = c.weekday;
    document.getElementById("course-start-time").value = c.start_time.slice(0, 5);
    document.getElementById("course-end-time").value = c.end_time.slice(0, 5);
    
    const catRadio = document.querySelector(`input[name="activity-category"][value="${c.category || 'university'}"]`);
    if (catRadio) catRadio.checked = true;
  } else {
    title.innerHTML = `<i class="fa-solid fa-calendar-plus text-indigo-600"></i> <span>Thêm hoạt động mới</span>`;
    document.getElementById("course-form").reset();
    document.getElementById("course-start-time").value = "05:00";
    document.getElementById("course-end-time").value = "06:00";
    const healthyRadio = document.querySelector(`input[name="activity-category"][value="healthy"]`);
    if (healthyRadio) healthyRadio.checked = true;
    onCategoryChange("healthy");
  }
  calculateDuration();
  modal.classList.remove("hidden");
}

function openModalWithTime(weekday, hour) {
  openModal(-1);
  const wdInput = document.getElementById("course-weekday");
  const startInput = document.getElementById("course-start-time");
  if (wdInput) wdInput.value = weekday;
  if (startInput) {
    const startH = hour.toString().padStart(2, '0');
    startInput.value = `${startH}:00`;
  }
  setPresetDuration(60);
}

function closeModal() {
  document.getElementById("course-modal")?.classList.add("hidden");
}

function editCourse(index) {
  openModal(index);
}

async function saveCourse(e) {
  e.preventDefault();
  const editIndex = parseInt(document.getElementById("edit-index").value, 10);
  const startTime = document.getElementById("course-start-time").value;
  const endTime = document.getElementById("course-end-time").value;
  const selectedCat = document.querySelector('input[name="activity-category"]:checked')?.value || 'university';

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    alert("Giờ kết thúc phải lớn hơn giờ bắt đầu!");
    return;
  }

  const newCourse = {
    code: document.getElementById("course-code").value.trim().toUpperCase(),
    name: document.getElementById("course-name").value.trim(),
    class: document.getElementById("course-class").value.trim(),
    room: document.getElementById("course-room").value.trim(),
    category: selectedCat,
    weekday: parseInt(document.getElementById("course-weekday").value, 10),
    start_time: startTime + (startTime.length === 5 ? ":00" : ""),
    end_time: endTime + (endTime.length === 5 ? ":00" : "")
  };

  if (editIndex >= 0) {
    courses[editIndex] = newCourse;
  } else {
    courses.push(newCourse);
  }

  try {
    await saveCoursesApi(courses);
    refreshCurrentView();
    closeModal();
    showToast(editIndex >= 0 ? "Đã cập nhật hoạt động!" : "Đã thêm hoạt động mới!");
  } catch (err) {
    showToast("Không thể lưu: " + err.message, "error");
  }
}

async function deleteCourse(index) {
  if (confirm(`Bạn có chắc muốn xóa "${courses[index].name}"?`)) {
    courses.splice(index, 1);
    try {
      await saveCoursesApi(courses);
      refreshCurrentView();
      showToast("Đã xóa hoạt động!");
    } catch (err) {
      showToast("Không thể xóa: " + err.message, "error");
    }
  }
}

async function applyPreset(presetType) {
  document.getElementById("preset-dropdown")?.classList.add("hidden");
  try {
    const data = await applyPresetApi(presetType);
    courses = data.courses;
    refreshCurrentView();
    showToast("✨ Đã áp dụng mẫu lịch thành công!");
  } catch (err) {
    showToast("Lỗi: " + err.message, "error");
  }
}

async function exportICS() {
  const btn = document.getElementById("btn-export-ics");
  if (!btn) return;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Đang xuất...`;
  btn.disabled = true;

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  try {
    const blob = await exportICSApi(startDate, endDate);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thoikhoabieu.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast("✅ Đã xuất và tải file thoikhoabieu.ics thành công!");
  } catch (err) {
    showToast("Lỗi: " + err.message, "error");
  } finally {
    btn.innerHTML = `<i class="fa-solid fa-file-arrow-down mr-1.5"></i> Xuất file .ics`;
    btn.disabled = false;
  }
}

function openSyncModal() {
  document.getElementById("sync-modal")?.classList.remove("hidden");
}
function closeSyncModal() {
  document.getElementById("sync-modal")?.classList.add("hidden");
}

async function startSyncCalendar() {
  const btn = document.getElementById("btn-start-sync");
  const logContainer = document.getElementById("sync-log-container");
  const calName = document.getElementById("sync-calendar-name").value.trim() || "primary";
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const selectedCats = Array.from(document.querySelectorAll('input[name="sync-cat"]:checked')).map(el => el.value);

  logContainer.classList.remove("hidden");
  logContainer.innerHTML = `<div class="text-emerald-400">⏳ Đang kết nối Google Calendar API...</div>`;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Đang đồng bộ...`;

  try {
    const data = await syncCalendarApi({
      calendar_name: calName,
      start_date: startDate,
      end_date: endDate,
      categories: selectedCats
    });

    logContainer.innerHTML = "";
    data.logs.forEach(log => {
      const line = document.createElement("div");
      line.innerText = log;
      logContainer.appendChild(line);
    });

    showToast("🎉 Đã đồng bộ lên Google Calendar thành công!");
  } catch (err) {
    logContainer.innerHTML += `<div class="text-rose-400 mt-2">❌ Lỗi: ${err.message}</div>`;
    showToast("Đồng bộ thất bại: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up mr-1.5"></i> Bắt đầu đồng bộ`;
  }
}

function openCleanModal() {
  document.getElementById("clean-modal")?.classList.remove("hidden");
}
function closeCleanModal() {
  document.getElementById("clean-modal")?.classList.add("hidden");
}

async function startCleanCalendar() {
  const btn = document.getElementById("btn-start-clean");
  const logContainer = document.getElementById("clean-log-container");
  const calName = document.getElementById("clean-calendar-name").value.trim() || "primary";
  const mode = document.querySelector('input[name="clean-mode"]:checked').value;

  logContainer.classList.remove("hidden");
  logContainer.innerHTML = `<div class="text-amber-400">⏳ Đang quét sự kiện...</div>`;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Đang dọn dẹp...`;

  try {
    const data = await cleanCalendarApi({ calendar_name: calName, mode: mode });
    logContainer.innerHTML = "";
    data.logs.forEach(log => {
      const line = document.createElement("div");
      line.innerText = log;
      logContainer.appendChild(line);
    });
    showToast(`✨ Đã dọn dẹp xong! Đã xóa ${data.deleted_count} chuỗi sự kiện.`);
  } catch (err) {
    logContainer.innerHTML += `<div class="text-rose-400 mt-2">❌ Lỗi: ${err.message}</div>`;
    showToast("Dọn dẹp thất bại: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-trash-can mr-1.5"></i> Tiến hành dọn dẹp`;
  }
}
