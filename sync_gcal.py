import argparse
import datetime
import glob
import json
import os
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]
BASE_DIR = os.path.dirname(__file__)
COURSES_FILE = os.path.join(BASE_DIR, "courses.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")
DEFAULT_START_DATE = datetime.date(2026, 9, 1)    # Bắt đầu từ tháng 9/2026
DEFAULT_END_DATE = datetime.date(2026, 12, 31)    # Hết tháng 12/2026

CATEGORY_COLORS = {
    "university": "9", # Blueberry / Indigo
    "english": "5",    # Banana / Amber
    "code": "7",       # Peacock / Cyan
    "project": "3",    # Grape / Purple
    "healthy": "10",   # Basil / Green
    "life": "6",       # Tangerine / Orange
    "leisure": "11"    # Flamingo / Rose
}

CATEGORY_EMOJIS = {
    "university": "🏫",
    "english": "🇬🇧",
    "code": "💻",
    "project": "🚀",
    "healthy": "🏃",
    "life": "🍳",
    "leisure": "🎮"
}

def find_credentials_file():
    std_path = os.path.join(BASE_DIR, "credentials.json")
    if os.path.exists(std_path):
        return std_path
    
    matches = glob.glob(os.path.join(BASE_DIR, "client_secret*.json")) + glob.glob(os.path.join(BASE_DIR, "*googleusercontent.com.json"))
    if matches:
        return matches[0]
    
    return None

def load_courses():
    if os.path.exists(COURSES_FILE):
        with open(COURSES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    raise FileNotFoundError(f"Không tìm thấy file {COURSES_FILE}")

def get_first_occurrence(start_date: datetime.date, target_weekday: int) -> datetime.date:
    days_ahead = (target_weekday - start_date.weekday()) % 7
    return start_date + datetime.timedelta(days=days_ahead)

def authenticate_google_calendar():
    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception as e:
            print(f"⚠️ Không đọc được token cũ ({e}), tiến hành xác thực lại...")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Đang làm mới access token...")
            creds.refresh(Request())
        else:
            cred_file = find_credentials_file()
            if not cred_file:
                print("❌ LỖI: Không tìm thấy file credentials OAuth!")
                print("👉 Vui lòng tải file OAuth Client JSON từ Google Cloud Console và đặt vào thư mục này.")
                sys.exit(1)
            
            print(f"🔑 Đang sử dụng file credentials: {os.path.basename(cred_file)}")
            print("🌐 Đang mở trình duyệt để bạn cấp quyền đăng nhập Google Calendar...")
            flow = InstalledAppFlow.from_client_secrets_file(cred_file, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w", encoding="utf-8") as token:
            token.write(creds.to_json())
        print("💾 Đã lưu token xác thực vào token.json\n")

    return build("calendar", "v3", credentials=creds)

def get_or_create_calendar(service, calendar_name):
    if calendar_name.lower() == "primary":
        return "primary"

    calendar_list = service.calendarList().list().execute()
    for item in calendar_list.get("items", []):
        if item.get("summary") == calendar_name:
            print(f"📌 Đã tìm thấy lịch: '{calendar_name}' (ID: {item['id']})")
            return item["id"]

    new_cal = {
        "summary": calendar_name,
        "timeZone": "Asia/Ho_Chi_Minh",
        "description": "Lịch tự động tạo bởi ứng dụng Google Calendar Schedule Manager"
    }
    created_cal = service.calendars().insert(body=new_cal).execute()
    print(f"✨ Đã tạo lịch mới: '{calendar_name}' (ID: {created_cal['id']})")
    return created_cal["id"]

def add_schedule_to_calendar(start_date: datetime.date = DEFAULT_START_DATE, end_date: datetime.date = DEFAULT_END_DATE, calendar_target: str = "primary", categories_filter: list = None):
    service = authenticate_google_calendar()
    cal_id = get_or_create_calendar(service, calendar_target)
    courses = load_courses()

    if categories_filter:
        courses = [c for c in courses if c.get("category", "university") in categories_filter]

    # Định dạng UNTIL theo UTC (GMT): 23:59:59 GMT+7 tương đương 16:59:59 UTC
    until_str = end_date.strftime("%Y%m%d") + "T165959Z"

    print(f"\n🚀 Bắt đầu đồng bộ {len(courses)} lịch trình lên Google Calendar...")
    print(f"👉 Thời gian áp dụng: Từ {start_date.strftime('%d/%m/%Y')} đến hết {end_date.strftime('%d/%m/%Y')}\n")

    weekday_names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

    for item in courses:
        cat = item.get("category", "university")
        emoji = CATEGORY_EMOJIS.get(cat, "📌")
        color_id = CATEGORY_COLORS.get(cat, "9")

        first_day = get_first_occurrence(start_date, item["weekday"])
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

        created_event = service.events().insert(calendarId=cal_id, body=event).execute()
        print(f"  ✅ Đã thêm: [{weekday_names[item['weekday']]}] Buổi đầu: {first_day.strftime('%d/%m/%Y')} | {emoji} {item['name']} ({location_str})")

    print("\n🎉 Tất cả hoạt động đã được thêm thành công vào Google Calendar!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Đồng bộ thời khóa biểu & lịch tự học lên Google Calendar")
    parser.add_argument("--start-date", type=str, default=DEFAULT_START_DATE.strftime("%Y-%m-%d"),
                        help="Ngày bắt đầu (định dạng YYYY-MM-DD, mặc định: 2026-09-01)")
    parser.add_argument("--end-date", type=str, default=DEFAULT_END_DATE.strftime("%Y-%m-%d"),
                        help="Ngày kết thúc (định dạng YYYY-MM-DD, mặc định: 2026-12-31)")
    parser.add_argument("--calendar", type=str, default="primary",
                        help="Tên lịch cần tạo/thêm vào, ví dụ: 'Thời Khóa Biểu & Tự Học' hoặc 'primary'")

    args = parser.parse_args()
    start_dt = datetime.datetime.strptime(args.start_date, "%Y-%m-%d").date()
    end_dt = datetime.datetime.strptime(args.end_date, "%Y-%m-%d").date()

    add_schedule_to_calendar(start_date=start_dt, end_date=end_dt, calendar_target=args.calendar)
