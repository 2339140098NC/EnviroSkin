LONG_SUN = {"1-3 hours", "3+ hours"}
OUTDOOR_LOCATIONS = {"Hiking or nature trail", "Rural or agricultural area"}


def select_fetchers(form_data: dict) -> dict:
    recent_location = form_data.get("recentLocation", "")
    sun_exposure = form_data.get("sunExposure", "")
    plant_exposure = form_data.get("plantExposure", "")
    ocean_exposure = form_data.get("oceanExposure", "")
    symptoms = form_data.get("symptoms", []) or []

    def _any_in(value, options):
        if isinstance(value, list):
            return any(v in options for v in value)
        return value in options

    return {
        "noaa_uv": True,
        "inaturalist": plant_exposure == "Yes" or _any_in(recent_location, OUTDOOR_LOCATIONS),
        "epa_aqi": True,
        "ucsd_heat": True,
        "calcofi_spray": ocean_exposure == "Yes" or _any_in(recent_location, {"Beach or outdoors near water", "Beach / outdoors near water"}),
        "snowflake_cluster": True,
    }
