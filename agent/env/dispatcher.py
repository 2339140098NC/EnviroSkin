LONG_SUN = {"1-3 hours", "3+ hours"}
OUTDOOR_LOCATIONS = {"Hiking or nature trail", "Rural or agricultural area"}


def select_fetchers(form_data: dict) -> dict:
    recent_location = form_data.get("recentLocation", "")
    sun_exposure = form_data.get("sunExposure", "")
    plant_exposure = form_data.get("plantExposure", "")
    ocean_exposure = form_data.get("oceanExposure", "")
    symptoms = form_data.get("symptoms", []) or []

    return {
        "noaa_uv": sun_exposure in LONG_SUN,
        "inaturalist": plant_exposure == "Yes" or recent_location in OUTDOOR_LOCATIONS,
        "epa_aqi": recent_location == "Urban area or city",
        "ucsd_heat": (sun_exposure and sun_exposure != "Less than 1 hour") or "Burning" in symptoms,
        "calcofi_spray": ocean_exposure == "Yes" or recent_location == "Beach or outdoors near water",
        "snowflake_cluster": True,
    }
