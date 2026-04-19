def fetch(zip_code: str, time_window=None) -> dict:
    return {
        "similar_cases_this_week": 8,
        "zip_code": zip_code or "unknown",
        "stub": True,
    }
