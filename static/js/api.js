// API communication service

async function fetchCoursesApi() {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Không thể tải danh sách hoạt động");
  return await res.json();
}

async function saveCoursesApi(courses) {
  const res = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courses)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Lỗi lưu dữ liệu lên máy chủ");
  }
  return await res.json();
}

async function applyPresetApi(presetType) {
  const res = await fetch("/api/presets/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preset: presetType })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi áp dụng mẫu lịch");
  return data;
}

async function exportICSApi(startDate, endDate) {
  const res = await fetch("/api/export-ics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start_date: startDate, end_date: endDate })
  });
  if (!res.ok) throw new Error("Lỗi khi tạo file .ics");
  return await res.blob();
}

async function syncCalendarApi(payload) {
  const res = await fetch("/api/sync-calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi đồng bộ Google Calendar");
  return data;
}

async function cleanCalendarApi(payload) {
  const res = await fetch("/api/clean-calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Lỗi dọn dẹp Google Calendar");
  return data;
}
