import re
from datetime import datetime

import requests


def _category(uv: int) -> str:
    if uv <= 2:
        return "Low"
    if uv <= 5:
        return "Moderate"
    if uv <= 7:
        return "High"
    if uv <= 10:
        return "Very High"
    return "Extreme"


def _parse_hour_24(date_time: str):
    if not date_time:
        return None

    candidate_formats = (
        "%Y-%m-%d %I %p",
        "%Y-%m-%d %I:%M %p",
        "%Y-%m-%d %H:%M",
        "%m/%d/%Y %I %p",
        "%m/%d/%Y %I:%M %p",
        "%m/%d/%Y %H:%M",
        "%b/%d/%Y %I %p",
        "%b/%d/%Y %I:%M %p",
        "%b %d, %Y %I %p",
        "%b %d, %Y %I:%M %p",
    )

    for fmt in candidate_formats:
        try:
            return datetime.strptime(date_time.strip(), fmt).hour
        except ValueError:
            continue

    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*([AP]M)", date_time, re.IGNORECASE)
    if match:
        hour = int(match.group(1)) % 12
        meridiem = match.group(3).upper()
        if meridiem == "PM":
            hour += 12
        return hour

    match_24 = re.search(r"\b(\d{1,2}):(\d{2})\b", date_time)
    if match_24:
        hour = int(match_24.group(1))
        if 0 <= hour <= 23:
            return hour

    return None


def _format_hour_label(hour_24: int) -> str:
    suffix = "AM" if hour_24 < 12 else "PM"
    hour_12 = hour_24 % 12 or 12
    return f"{hour_12}:00 {suffix}"


def fetch(zip_code: str, time_window=None) -> dict:
    if not zip_code:
        return {"error": "no zip code provided"}

    url = f"https://data.epa.gov/efservice/getEnvirofactsUVHOURLY/ZIP/{zip_code}/JSON"
    try:
        response = requests.get(url, timeout=8)
        response.raise_for_status()
        rows = response.json()
    except Exception as exc:
        return {"error": f"NOAA UV fetch failed: {exc}"}

    if not rows:
        return {"error": "NOAA UV returned no rows"}

    hourly_rows = []
    for row in rows:
        raw_uv = row.get("UV_VALUE", 0)
        try:
            uv_value = int(raw_uv)
        except (TypeError, ValueError):
            continue

        date_time = row.get("DATE_TIME", "")
        hour_24 = _parse_hour_24(date_time)
        if hour_24 is None or hour_24 < 8 or hour_24 > 20:
            continue

        hourly_rows.append(
            {
                "hour_24": hour_24,
                "label": _format_hour_label(hour_24),
                "uv_value": uv_value,
                "category": _category(uv_value),
                "date_time": date_time,
            }
        )

    hourly_rows.sort(key=lambda entry: entry["hour_24"])

    peak_source = hourly_rows if hourly_rows else rows
    peak = max(peak_source, key=lambda r: r.get("uv_value", r.get("UV_VALUE", 0)))
    uv_value = int(peak.get("uv_value", peak.get("UV_VALUE", 0)))

    return {
        "uv_index": uv_value,
        "category": _category(uv_value),
        "hour": peak.get("date_time", peak.get("DATE_TIME", "")),
        "hourly_forecast": hourly_rows,
    }
