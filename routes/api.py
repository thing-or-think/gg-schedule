import datetime
from flask import Blueprint, request, jsonify, send_file
import export_ics
from config import OUTPUT_ICS, DEFAULT_UNIVERSITY_COURSES
from services.schedule_service import (
    load_courses,
    save_courses,
    get_default_full_schedule,
    apply_preset
)
from services.gcal_service import sync_events_to_gcal, clean_gcal_events

api_bp = Blueprint("api", __name__, url_prefix="/api")

@api_bp.route("/courses", methods=["GET"])
def get_courses():
    courses = load_courses()
    return jsonify(courses)

@api_bp.route("/courses", methods=["POST"])
def update_courses():
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400
    save_courses(data)
    return jsonify({"status": "success", "count": len(data)})

@api_bp.route("/presets", methods=["GET"])
def get_presets():
    full_schedule = get_default_full_schedule()
    return jsonify({
        "balanced": {
            "name": "Lịch Tối Ưu Toàn Diện (Thứ 2 Ở Lại Trường)",
            "description": "05:00 Chạy bộ, Thứ 2 ở lại trường cả ngày, 3 cữ TA/ngày, Dự án & LeetCode",
            "data": full_schedule
        },
        "university": {
            "name": "Chỉ 6 Môn Học Trường",
            "description": "Khôi phục chỉ giữ 6 môn học đại học ban đầu",
            "data": DEFAULT_UNIVERSITY_COURSES
        }
    })

@api_bp.route("/presets/apply", methods=["POST"])
def apply_preset_route():
    req_data = request.get_json() or {}
    preset_type = req_data.get("preset", "balanced")
    try:
        updated_courses = apply_preset(preset_type)
        return jsonify({"status": "success", "count": len(updated_courses), "courses": updated_courses})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route("/courses/reset", methods=["POST"])
def reset_courses():
    save_courses(DEFAULT_UNIVERSITY_COURSES)
    return jsonify(DEFAULT_UNIVERSITY_COURSES)

@api_bp.route("/export-ics", methods=["POST"])
def export_ics_route():
    data = request.get_json() or {}
    start_str = data.get("start_date", "2026-09-01")
    end_str = data.get("end_date", "2026-12-31")
    categories = data.get("categories", None)

    try:
        start_date = datetime.datetime.strptime(start_str, "%Y-%m-%d").date()
        end_date = datetime.datetime.strptime(end_str, "%Y-%m-%d").date()

        export_ics.create_ics(
            start_date=start_date,
            end_date=end_date,
            output_path=OUTPUT_ICS,
            categories_filter=categories
        )

        return send_file(
            OUTPUT_ICS,
            as_attachment=True,
            download_name="thoikhoabieu.ics",
            mimetype="text/calendar"
        )
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

@api_bp.route("/sync-calendar", methods=["POST"])
def sync_calendar_route():
    data = request.get_json() or {}
    cal_name = data.get("calendar_name", "primary")
    start_str = data.get("start_date", "2026-09-01")
    end_str = data.get("end_date", "2026-12-31")
    categories = data.get("categories", None)

    try:
        start_date = datetime.datetime.strptime(start_str, "%Y-%m-%d").date()
        end_date = datetime.datetime.strptime(end_str, "%Y-%m-%d").date()

        logs = sync_events_to_gcal(
            cal_name=cal_name,
            start_date=start_date,
            end_date=end_date,
            categories=categories
        )
        return jsonify({"status": "success", "logs": logs})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e), "logs": [str(e)]}), 500

@api_bp.route("/clean-calendar", methods=["POST"])
def clean_calendar_route():
    data = request.get_json() or {}
    cal_name = data.get("calendar_name", "primary")
    mode = data.get("mode", "duplicates")

    try:
        deleted_count, logs = clean_gcal_events(cal_name=cal_name, mode=mode)
        return jsonify({"status": "success", "deleted_count": deleted_count, "logs": logs})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e), "logs": [str(e)]}), 500
