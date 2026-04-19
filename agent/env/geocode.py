import requests

HARDCODED = {
    "92093": (32.8801, -117.2340),
    "90001": (33.9731, -118.2479),
    "10001": (40.7506, -73.9972),
}


def zip_to_latlon(zip_code: str) -> tuple[float, float] | None:
    if not zip_code:
        return None

    zip_code = zip_code.strip()
    if zip_code in HARDCODED:
        return HARDCODED[zip_code]

    try:
        response = requests.get(f"https://api.zippopotam.us/us/{zip_code}", timeout=5)
        response.raise_for_status()
        data = response.json()
        place = data["places"][0]
        return float(place["latitude"]), float(place["longitude"])
    except Exception:
        return None
