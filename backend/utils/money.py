"""Money utility module for integer paise handling and rupee formatting."""
from decimal import Decimal, ROUND_HALF_UP


def rupees_to_paise(amount_rupees: float | int | str | Decimal) -> int:
    """Converts a rupee value to integer paise using exact decimal rounding.
    e.g. 1250.50 -> 125050
    """
    if amount_rupees is None or amount_rupees == "":
        return 0
    d = Decimal(str(amount_rupees))
    paise = (d * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(paise)


def paise_to_rupees(paise: int) -> float:
    """Converts integer paise to float rupees for display/reporting."""
    return round(paise / 100.0, 2)


def format_inr(paise: int, include_symbol: bool = True) -> str:
    """Formats paise into standard Indian numbering system (e.g., ₹1,23,456.50)."""
    is_negative = paise < 0
    abs_paise = abs(paise)
    rupees_part = abs_paise // 100
    paise_part = abs_paise % 100

    s = str(rupees_part)
    if len(s) <= 3:
        formatted_rupees = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        # Group in pairs of 2 from right to left
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        formatted_rupees = ",".join(groups) + "," + last3

    formatted_str = f"{formatted_rupees}.{paise_part:02d}"
    if is_negative:
        formatted_str = "-" + formatted_str

    if include_symbol:
        return f"₹{formatted_str}"
    return formatted_str
