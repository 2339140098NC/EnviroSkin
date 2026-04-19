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

    rows = None
    last_exc = None
    for attempt in range(2):
        try:
            response = requests.get(
                "https://www.airnowapi.org/aq/observation/zipCode/current/",
                params={
                    "format": "application/json",
                    "zipCode": zip_code,
                    "distance": 25,
                    "API_KEY": api_key,
                },
                timeout=15,
            )
            response.raise_for_status()
            rows = response.json()
            break
        except (requests.Timeout, requests.ConnectionError) as exc:
            last_exc = exc
            continue
        except Exception as exc:
            return {"error": f"AirNow fetch failed: {exc}"}
    if rows is None:
        return {"error": f"AirNow fetch failed: {last_exc}"}

    if not rows:
        return {"error": "AirNow returned no observations"}

    worst = max(rows, key=lambda r: r.get("AQI", 0))
    return {
        "aqi": worst.get("AQI"),
        "category": (worst.get("Category") or {}).get("Name", "Unknown"),
        "dominant_pollutant": worst.get("ParameterName", "Unknown"),
    }
