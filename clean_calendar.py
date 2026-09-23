import argparse
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

def find_credentials_file():
    std_path = os.path.join(BASE_DIR, "credentials.json")
    if os.path.exists(std_path):
        return std_path
    matches = glob.glob(os.path.join(BASE_DIR, "client_secret*.json")) + glob.glob(os.path.join(BASE_DIR, "*googleusercontent.com.json"))
    if matches:
        return matches[0]
    return None

def authenticate_google_calendar():
    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception as e:
            print(f"⚠️ Không đọc được token ({e}), tiến hành xác thực lại...")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            cred_file = find_credentials_file()
            if not cred_file:
                print("❌ Không tìm thấy file credentials!")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(cred_file, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w", encoding="utf-8") as token:
            token.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)

def load_course_codes():
    if os.path.exists(COURSES_FILE):
        with open(COURSES_FILE, "r", encoding="utf-8") as f:
            courses = json.load(f)
            codes = [c["code"] for c in courses if "code" in c]
            return list(set(codes))
    return ["INT3117", "INT3111", "INT3304", "INT3109", "INT3401", "INT3202", "ENG", "CODE", "PROJ", "RUN", "MEAL", "REST"]

def clean_schedule(mode="duplicates", calendar_target="primary"):
    """
    mode: 'duplicates' (chỉ xóa các chuỗi môn bị trùng, giữ lại 1 bản)
          'all' (xóa sạch toàn bộ các môn học/hoạt động)
    """
    service = authenticate_google_calendar()
    course_codes = load_course_codes()
    
    # Tìm calendar ID
    cal_id = "primary"
    if calendar_target.lower() != "primary":
        calendar_list = service.calendarList().list().execute()
        for item in calendar_list.get("items", []):
            if item.get("summary") == calendar_target:
                cal_id = item["id"]
                break

    print(f"🔍 Đang tìm kiếm các sự kiện trên lịch '{calendar_target}'...")
    
    events_result = service.events().list(
        calendarId=cal_id,
        singleEvents=False,
        maxResults=2500
    ).execute()
    
    events = events_result.get("items", [])
    
    matched_events = {}
    known_emojis = ["🏫", "🇬🇧", "💻", "🚀", "🏃", "🍳", "🎮", "📌"]

    for event in events:
        summary = event.get("summary", "")
        # Kiểm tra theo mã hoặc emoji phân loại
        is_matched = any(f"[{code}]" in summary for code in course_codes) or any(em in summary for em in known_emojis)
        if is_matched:
            if summary not in matched_events:
                matched_events[summary] = []
            matched_events[summary].append(event)

    if not matched_events:
        print("✅ Không tìm thấy sự kiện nào cần xóa!")
        return

    print(f"📋 Tìm thấy {sum(len(v) for v in matched_events.values())} chuỗi sự kiện:")

    deleted_count = 0
    for summary, event_list in matched_events.items():
        print(f"\n👉 Sự kiện: {summary} (Có {len(event_list)} chuỗi lặp lại)")
        
        if mode == "duplicates":
            to_delete = event_list[1:]
            if not to_delete:
                print("   ✔ Chỉ có 1 bản, không bị trùng.")
            for ev in to_delete:
                service.events().delete(calendarId=cal_id, eventId=ev["id"]).execute()
                print(f"   🗑️ Đã xóa 1 chuỗi bị trùng thừa (ID: {ev['id'][:10]}...)")
                deleted_count += 1
        elif mode == "all":
            for ev in event_list:
                service.events().delete(calendarId=cal_id, eventId=ev["id"]).execute()
                print(f"   🗑️ Đã xóa chuỗi (ID: {ev['id'][:10]}...)")
                deleted_count += 1

    print(f"\n✨ Hoàn tất! Đã xóa thành công {deleted_count} chuỗi sự kiện.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dọn dẹp và xóa các môn học/hoạt động bị trùng lặp trên Google Calendar")
    parser.add_argument("--mode", choices=["duplicates", "all"], default="duplicates",
                        help="'duplicates' = chỉ xóa bản thừa bị trùng; 'all' = xóa sạch tất cả")
    parser.add_argument("--calendar", type=str, default="primary",
                        help="Tên lịch cần dọn dẹp (mặc định: primary)")

    args = parser.parse_args()
    clean_schedule(mode=args.mode, calendar_target=args.calendar)
