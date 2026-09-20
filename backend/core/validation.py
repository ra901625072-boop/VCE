"""Input validation helper routines."""
import re
from datetime import datetime
from backend.core.exceptions import ValidationException


def validate_positive_amount(amount_paise: int, field_name: str = "amount") -> int:
    """Validates that an amount in paise is strictly non-negative and integer."""
    if not isinstance(amount_paise, int):
        raise ValidationException(f"{field_name} must be an integer paise amount.")
    if amount_paise < 0:
        raise ValidationException(f"{field_name} cannot be negative.")
    return amount_paise


def validate_date_str(date_str: str, field_name: str = "date") -> str:
    """Validates YYYY-MM-DD date format."""
    if not date_str:
        raise ValidationException(f"{field_name} is required.")
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except ValueError:
        raise ValidationException(f"{field_name} must be in YYYY-MM-DD format, got '{date_str}'.")


def validate_time_str(time_str: str, field_name: str = "time") -> str:
    """Validates HH:MM or HH:MM:SS time format."""
    if not time_str:
        return ""
    pattern = r"^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$"
    if not re.match(pattern, time_str):
        raise ValidationException(f"{field_name} must be in HH:MM or HH:MM:SS format, got '{time_str}'.")
    return time_str
