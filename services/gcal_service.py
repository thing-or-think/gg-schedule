import sync_gcal
import clean_calendar
from config import CATEGORY_COLOR_MAP, CATEGORY_EMOJI_MAP, WEEKDAY_NAMES
from services.schedule_service import load_courses

def sync_events_to_gcal(cal_name, start_date, end_date, categories=None):
    """Synchronizes schedule courses to Google Calendar API."""
    logs = []
    service = sync_gcal.authenticate_google_calendar()
    cal_id = sync_gcal.get_or_create_calendar(service, cal_name)
    courses = load_courses()

    if categories:
        courses = [c for c in courses if c.get("category", "university") in categories]

    until_str = end_date.strftime("%Y%m%d") + "T165959Z"
    logs.append(f"🚀 Bắt đầu thêm {len(courses)} hoạt động/môn học vào lịch '{cal_name}'...")
    logs.append(f"👉 Thời gian: Từ {start_date.strftime('%d/%m/%Y')} đến hết {end_date.strftime('%d/%m/%Y')}")

    for item in courses:
        cat = item.get("category", "university")
        emoji = CATEGORY_EMOJI_MAP.get(cat, "📌")
        color_id = CATEGORY_COLOR_MAP.get(cat, "9")

        first_day = sync_gcal.get_first_occurrence(start_date, item["weekday"])
        start_iso = f"{first_day.strftime('%Y-%m-%d')}T{item['start_time']}+07:00"
        end_iso = f"{first_day.strftime('%Y-%m-%d')}T{item['end_time']}+07:00"

        location_str = f"Giảng đường {item.get('room', '')}" if cat == "university" else item.get('room', 'Ở nhà')

        event = {
            "summary": f"{emoji} [{item['code']}] {item['name']}",
            "location": location_str,
            "description": f"Hoạt động: {item['name']}\nPhân loại: {cat.upper()}\nGhi chú: {item.get('class', '')}\nĐịa điểm: {location_str}",
            "colorId": color_id,
            "start": {
                "dateTime": start_iso,
                "timeZone": "Asia/Ho_Chi_Minh",
            },
            "end": {
                "dateTime": end_iso,
                "timeZone": "Asia/Ho_Chi_Minh",
            },
            "recurrence": [
                f"RRULE:FREQ=WEEKLY;UNTIL={until_str}"
            ],
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 15},
                ],
            },
        }

        service.events().insert(calendarId=cal_id, body=event).execute()
        logs.append(f"  ✅ [{WEEKDAY_NAMES[item['weekday']]}] {emoji} {item['name']} ({location_str}) -> Đã tạo!")

    logs.append(f"🎉 Đã đồng bộ thành công {len(courses)} lịch trình lên Google Calendar!")
    return logs

def clean_gcal_events(cal_name="primary", mode="duplicates"):
    """Cleans duplicate or all schedule events from Google Calendar."""
    logs = []
    service = clean_calendar.authenticate_google_calendar()
    course_codes = clean_calendar.load_course_codes()

    cal_id = "primary"
    if cal_name.lower() != "primary":
        calendar_list = service.calendarList().list().execute()
        for item in calendar_list.get("items", []):
            if item.get("summary") == cal_name:
                cal_id = item["id"]
                break

    events_result = service.events().list(
        calendarId=cal_id,
        singleEvents=False,
        maxResults=2500
    ).execute()

    events = events_result.get("items", [])
    matched_events = {}
    for event in events:
        summary = event.get("summary", "")
        if any(f"[{code}]" in summary for code in course_codes) or any(emoji in summary for emoji in ["🏫", "🇬🇧", "💻", "🚀", "🏃", "🍳", "🎮"]):
            if summary not in matched_events:
                matched_events[summary] = []
            matched_events[summary].append(event)

    deleted_count = 0
    if not matched_events:
        logs.append("✔ Không tìm thấy sự kiện nào cần xóa.")
    else:
        for summary, event_list in matched_events.items():
            if mode == "duplicates":
                to_delete = event_list[1:]
                if not to_delete:
                    logs.append(f"  ✔ [{summary}]: Chỉ có 1 bản, không bị trùng.")
                for ev in to_delete:
                    service.events().delete(calendarId=cal_id, eventId=ev["id"]).execute()
                    logs.append(f"  🗑️ [{summary}]: Đã xóa 1 chuỗi lặp thừa.")
                    deleted_count += 1
            elif mode == "all":
                for ev in event_list:
                    service.events().delete(calendarId=cal_id, eventId=ev["id"]).execute()
                    logs.append(f"  🗑️ [{summary}]: Đã xóa sự kiện.")
                    deleted_count += 1

    logs.append(f"✨ Hoàn tất dọn dẹp! Đã xóa {deleted_count} chuỗi sự kiện.")
    return deleted_count, logs
