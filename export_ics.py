import argparse
import datetime
import json
import os
import pytz
from icalendar import Calendar, Event, Alarm

COURSES_FILE = os.path.join(os.path.dirname(__file__), "courses.json")
OUTPUT_ICS = os.path.join(os.path.dirname(__file__), "thoikhoabieu.ics")

DEFAULT_START_DATE = datetime.date(2026, 9, 1)    # Bắt đầu từ đầu tháng 9/2026
DEFAULT_END_DATE = datetime.date(2026, 12, 31)    # Hết tháng 12/2026
TZ = pytz.timezone("Asia/Ho_Chi_Minh")

CATEGORY_EMOJIS = {
    "university": "🏫",
    "english": "🇬🇧",
    "code": "💻",
    "project": "🚀",
    "healthy": "🏃",
    "life": "🍳",
    "leisure": "🎮"
}

def load_courses():
    if os.path.exists(COURSES_FILE):
        with open(COURSES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    raise FileNotFoundError(f"Không tìm thấy file {COURSES_FILE}")

def get_first_occurrence(start_date: datetime.date, target_weekday: int) -> datetime.date:
    """
    Tìm ngày đầu tiên diễn ra môn học / hoạt động kể từ start_date.
    target_weekday: 0=Thứ 2, 1=Thứ 3, ..., 6=Chủ nhật
    """
    days_ahead = (target_weekday - start_date.weekday()) % 7
    return start_date + datetime.timedelta(days=days_ahead)

def create_ics(start_date: datetime.date = DEFAULT_START_DATE, end_date: datetime.date = DEFAULT_END_DATE, output_path: str = OUTPUT_ICS, categories_filter: list = None):
    courses = load_courses()
    
    if categories_filter:
        courses = [c for c in courses if c.get("category", "university") in categories_filter]

    cal = Calendar()
    cal.add("prodid", "-//Thoi Khoa Bieu Sinh Vien & Self-Study//VN")
    cal.add("version", "2.0")
    cal.add("calscale", "GREGORIAN")
    cal.add("x-wr-calname", "Thời khóa biểu & Lịch Tự Học (09/2026 - 12/2026)")
    cal.add("x-wr-timezone", "Asia/Ho_Chi_Minh")

    # Mốc kết thúc lặp lại (cuối ngày của end_date theo giờ Việt Nam, quy đổi sang UTC theo chuẩn RFC 5545)
    until_dt_local = TZ.localize(datetime.datetime.combine(end_date, datetime.time(23, 59, 59)))
    until_dt_utc = until_dt_local.astimezone(pytz.utc)

    print(f"📅 Đang tạo file lịch .ics...")
    print(f"👉 Thời gian áp dụng: Từ {start_date.strftime('%d/%m/%Y')} đến hết {end_date.strftime('%d/%m/%Y')}\n")

    weekday_names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

    for c in courses:
        cat = c.get("category", "university")
        emoji = CATEGORY_EMOJIS.get(cat, "📌")
        location_str = f"Giảng đường {c.get('room', '')}" if cat == "university" else c.get('room', 'Ở nhà')

        event = Event()
        event.add("summary", f"{emoji} [{c['code']}] {c['name']}")
        event.add("location", location_str)
        event.add("description", f"Hoạt động: {c['name']}\nPhân loại: {cat.upper()}\nGhi chú: {c.get('class', '')}\nĐịa điểm: {location_str}")
        
        first_day = get_first_occurrence(start_date, c["weekday"])
        sh, sm, ss = map(int, c["start_time"].split(":"))
        eh, em, es = map(int, c["end_time"].split(":"))
        
        dtstart = TZ.localize(datetime.datetime.combine(first_day, datetime.time(sh, sm, ss)))
        dtend = TZ.localize(datetime.datetime.combine(first_day, datetime.time(eh, em, es)))
        
        event.add("dtstart", dtstart)
        event.add("dtend", dtend)
        event.add("dtstamp", TZ.localize(datetime.datetime.now()))
        # Lặp lại hàng tuần cho đến hết ngày kết thúc
        event.add("rrule", {"freq": "weekly", "until": until_dt_utc})

        # Nhắc nhở thông báo trước 15 phút
        alarm = Alarm()
        alarm.add("action", "DISPLAY")
        alarm.add("description", f"Nhắc nhở: Sắp đến giờ [{c['name']}]")
        alarm.add("trigger", datetime.timedelta(minutes=-15))
        event.add_component(alarm)

        cal.add_component(event)
        print(f"  + [{weekday_names[c['weekday']]}] Buổi đầu: {first_day.strftime('%d/%m/%Y')} ({c['start_time'][:5]}-{c['end_time'][:5]}) | {emoji} {c['name']} - {location_str}")

    with open(output_path, "wb") as f:
        f.write(cal.to_ical())

    print(f"\n✅ Đã xuất file thành công: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Xuất file .ics cho thời khóa biểu & lịch tự học")
    parser.add_argument("--start-date", type=str, default=DEFAULT_START_DATE.strftime("%Y-%m-%d"),
                        help="Ngày bắt đầu (định dạng YYYY-MM-DD, mặc định: 2026-09-01)")
    parser.add_argument("--end-date", type=str, default=DEFAULT_END_DATE.strftime("%Y-%m-%d"),
                        help="Ngày kết thúc (định dạng YYYY-MM-DD, mặc định: 2026-12-31)")
    parser.add_argument("--output", type=str, default=OUTPUT_ICS,
                        help="Đường dẫn file .ics đầu ra (mặc định: thoikhoabieu.ics)")

    args = parser.parse_args()
    start_dt = datetime.datetime.strptime(args.start_date, "%Y-%m-%d").date()
    end_dt = datetime.datetime.strptime(args.end_date, "%Y-%m-%d").date()

    create_ics(start_date=start_dt, end_date=end_dt, output_path=args.output)
