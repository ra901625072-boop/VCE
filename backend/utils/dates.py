"""Date and time handling utilities."""
from datetime import datetime, date, timedelta, timezone
from typing import Optional, Tuple


def now_utc_iso() -> str:
    """Returns current UTC timestamp in ISO-8601 string."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def current_date_str() -> str:
    """Returns current date in YYYY-MM-DD string."""
    return date.today().strftime("%Y-%m-%d")


today_date_str = current_date_str


def current_time_str() -> str:
    """Returns current time in HH:MM:SS string."""
    return datetime.now().strftime("%H:%M:%S")


def get_current_fy_label(target_date: Optional[date] = None) -> str:
    """Returns the Indian Financial Year label (e.g. 'FY 2026-27') for the given date or today."""
    d = target_date or date.today()
    start_year = d.year if d.month >= 4 else d.year - 1
    next_year_suffix = str(start_year + 1)[-2:]
    return f"FY {start_year}-{next_year_suffix}"


def get_date_range(preset: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
    """Calculates start and end date (YYYY-MM-DD) based on preset filter or custom range.
    Presets: all, today, yesterday, this_week, this_month, this_year, this_fy, last_fy, q1_fy, q2_fy, q3_fy, q4_fy, custom
    """
    today = date.today()
    if preset == "today":
        d_str = today.strftime("%Y-%m-%d")
        return d_str, d_str
    elif preset == "yesterday":
        y_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        return y_str, y_str
    elif preset == "this_week":
        # Monday of current week
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
        return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")
    elif preset == "this_month":
        start = today.replace(day=1)
        # Next month minus 1 day
        next_month = (start + timedelta(days=32)).replace(day=1)
        end = next_month - timedelta(days=1)
        return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")
    elif preset == "this_year":
        start = today.replace(month=1, day=1)
        end = today.replace(month=12, day=31)
        return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")
    elif preset == "this_fy":
        fy_start_year = today.year if today.month >= 4 else today.year - 1
        return f"{fy_start_year}-04-01", f"{fy_start_year + 1}-03-31"
    elif preset == "last_fy":
        fy_start_year = (today.year - 1) if today.month >= 4 else (today.year - 2)
        return f"{fy_start_year}-04-01", f"{fy_start_year + 1}-03-31"
    elif preset == "q1_fy":
        fy_start_year = today.year if today.month >= 4 else today.year - 1
        return f"{fy_start_year}-04-01", f"{fy_start_year}-06-30"
    elif preset == "q2_fy":
        fy_start_year = today.year if today.month >= 4 else today.year - 1
        return f"{fy_start_year}-07-01", f"{fy_start_year}-09-30"
    elif preset == "q3_fy":
        fy_start_year = today.year if today.month >= 4 else today.year - 1
        return f"{fy_start_year}-10-01", f"{fy_start_year}-12-31"
    elif preset == "q4_fy":
        fy_start_year = today.year if today.month >= 4 else today.year - 1
        return f"{fy_start_year + 1}-01-01", f"{fy_start_year + 1}-03-31"
    elif preset == "custom":
        return start_date, end_date
    elif preset == "all":
        return None, None
    return start_date, end_date
