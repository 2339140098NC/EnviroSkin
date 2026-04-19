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

    peak = max(rows, key=lambda r: r.get("UV_VALUE", 0))
    uv_value = int(peak.get("UV_VALUE", 0))

    return {
        "uv_index": uv_value,
        "category": _category(uv_value),
        "hour": peak.get("DATE_TIME", ""),
    }
