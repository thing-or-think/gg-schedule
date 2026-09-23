import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COURSES_FILE = os.path.join(BASE_DIR, "courses.json")
OUTPUT_ICS = os.path.join(BASE_DIR, "thoikhoabieu.ics")

DEFAULT_UNIVERSITY_COURSES = [
    {
        "code": "INT3117",
        "name": "Kiểm thử và đảm bảo chất lượng phần mềm",
        "class": "INT3117 3",
        "room": "207-B",
        "category": "university",
        "weekday": 0,
        "start_time": "10:00:00",
        "end_time": "12:40:00"
    },
    {
        "code": "INT3111",
        "name": "Quản lý dự án phần mềm",
        "class": "INT3111 2",
        "room": "104-B",
        "category": "university",
        "weekday": 0,
        "start_time": "16:00:00",
        "end_time": "18:40:00"
    },
    {
        "code": "INT3304",
        "name": "Lập trình mạng",
        "class": "INT3304 1",
        "room": "204-A",
        "category": "university",
        "weekday": 1,
        "start_time": "07:00:00",
        "end_time": "09:40:00"
    },
    {
        "code": "INT3109",
        "name": "Thu thập và phân tích yêu cầu",
        "class": "INT3109 1",
        "room": "101-A",
        "category": "university",
        "weekday": 3,
        "start_time": "10:00:00",
        "end_time": "12:40:00"
    },
    {
        "code": "INT3401",
        "name": "Trí tuệ nhân tạo",
        "class": "INT3401 5",
        "room": "507-B",
        "category": "university",
        "weekday": 4,
        "start_time": "07:00:00",
        "end_time": "09:40:00"
    },
    {
        "code": "INT3202",
        "name": "Hệ quản trị cơ sở dữ liệu",
        "class": "INT3202 2",
        "room": "201-B",
        "category": "university",
        "weekday": 4,
        "start_time": "10:00:00",
        "end_time": "12:40:00"
    }
]

CATEGORY_COLOR_MAP = {
    "university": "9",
    "english": "5",
    "code": "7",
    "project": "3",
    "healthy": "10",
    "life": "6",
    "leisure": "11"
}

CATEGORY_EMOJI_MAP = {
    "university": "🏫",
    "english": "🇬🇧",
    "code": "💻",
    "project": "🚀",
    "healthy": "🏃",
    "life": "🍳",
    "leisure": "🎮"
}

WEEKDAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
