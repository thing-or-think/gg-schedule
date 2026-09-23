import json
import os
from config import COURSES_FILE, DEFAULT_UNIVERSITY_COURSES

def get_default_full_schedule():
    """Returns the full balanced schedule from courses.json if available, or default university courses."""
    if os.path.exists(COURSES_FILE):
        try:
            with open(COURSES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_UNIVERSITY_COURSES

def load_courses():
    """Loads courses from courses.json with fallback to default full schedule."""
    if not os.path.exists(COURSES_FILE):
        schedule = get_default_full_schedule()
        save_courses(schedule)
        return schedule
    try:
        with open(COURSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            for item in data:
                if "category" not in item:
                    item["category"] = "university"
            return data
    except Exception:
        schedule = get_default_full_schedule()
        save_courses(schedule)
        return schedule

def save_courses(courses):
    """Saves courses array to courses.json formatted cleanly in UTF-8."""
    with open(COURSES_FILE, "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

def apply_preset(preset_type):
    """Applies a schedule preset and saves it to courses.json."""
    full_schedule = get_default_full_schedule()

    if preset_type == "university":
        selected_data = DEFAULT_UNIVERSITY_COURSES
    elif preset_type == "balanced":
        selected_data = full_schedule
    elif preset_type == "add_english":
        current = load_courses()
        eng_items = [x for x in full_schedule if x.get("category") == "english"]
        current_keys = {(c["weekday"], c["start_time"]) for c in current}
        to_add = [x for x in eng_items if (x["weekday"], x["start_time"]) not in current_keys]
        selected_data = current + to_add
    elif preset_type == "add_healthy":
        current = load_courses()
        run_items = [x for x in full_schedule if x.get("category") in ["healthy", "life"]]
        current_keys = {(c["weekday"], c["start_time"]) for c in current}
        to_add = [x for x in run_items if (x["weekday"], x["start_time"]) not in current_keys]
        selected_data = current + to_add
    elif preset_type == "add_code_project":
        current = load_courses()
        code_items = [x for x in full_schedule if x.get("category") in ["code", "project"]]
        current_keys = {(c["weekday"], c["start_time"]) for c in current}
        to_add = [x for x in code_items if (x["weekday"], x["start_time"]) not in current_keys]
        selected_data = current + to_add
    else:
        raise ValueError("Preset không tồn tại")

    save_courses(selected_data)
    return selected_data
