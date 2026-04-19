import os
import requests


def _stub() -> dict:
    return {
        "aqi": 42,
        "category": "Good",
        "dominant_pollutant": "O3",
        "stub": True,
    }


def fetch(zip_code: str, time_window=None) -> dict:
    api_key = os.environ.get("AIRNOW_API_KEY")
    if not api_key:
        return _stub()
    if not zip_code:
        return {"error": "no zip code provided"}

    try:
        response = requests.get(
            "https://www.airnowapi.org/aq/observation/zipCode/current/",
            params={
                "format": "application/json",
                "zipCode": zip_code,
                "distance": 25,
                "API_KEY": api_key,
            },
            timeout=8,
        )
        response.raise_for_status()
        rows = response.json()
    except Exception as exc:
        return {"error": f"AirNow fetch failed: {exc}"}

    if not rows:
        return {"error": "AirNow returned no observations"}

    worst = max(rows, key=lambda r: r.get("AQI", 0))
    return {
        "aqi": worst.get("AQI"),
        "category": (worst.get("Category") or {}).get("Name", "Unknown"),
        "dominant_pollutant": worst.get("ParameterName", "Unknown"),
    }
