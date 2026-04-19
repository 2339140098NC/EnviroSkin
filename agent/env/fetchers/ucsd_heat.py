import os
import requests


def _stub() -> dict:
    return {
        "heat_index_f": 98,
        "humidity_pct": 61,
        "stub": True,
    }


def fetch(latlon=None, time_window=None) -> dict:
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if not api_key or not latlon:
        return _stub()

    lat, lon = latlon
    try:
        response = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "imperial",
            },
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        return {"error": f"OpenWeatherMap fetch failed: {exc}"}

    main = data.get("main") or {}
    return {
        "heat_index_f": int(main.get("feels_like", 0)),
        "humidity_pct": int(main.get("humidity", 0)),
        "temp_f": int(main.get("temp", 0)),
    }
