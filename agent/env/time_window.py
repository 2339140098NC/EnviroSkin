from datetime import datetime, timedelta


def derive(form_data: dict) -> tuple[datetime, datetime]:
    now = datetime.now()
    timing = form_data.get("onsetSpecificTiming", "")

    if timing == "Within the last few hours":
        return now - timedelta(hours=6), now
    if timing == "Today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now
    if timing == "Yesterday":
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return today_start - timedelta(days=1), today_start
    if timing == "A few days ago":
        return now - timedelta(days=4), now
    if timing == "More than a week ago":
        return now - timedelta(days=14), now

    return now - timedelta(days=2), now
