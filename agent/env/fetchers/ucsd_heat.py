import requests


def fetch(latlon=None, time_window=None) -> dict:
    if not latlon:
        return {"error": "no coordinates available"}

    lat, lon = latlon
    try:
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature",
                "temperature_unit": "fahrenheit",
            },
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        return {"error": f"Open-Meteo fetch failed: {exc}"}

    current = data.get("current") or {}
    return {
        "heat_index_f": int(current.get("apparent_temperature", 0)),
        "humidity_pct": int(current.get("relative_humidity_2m", 0)),
        "temp_f": int(current.get("temperature_2m", 0)),
    }
