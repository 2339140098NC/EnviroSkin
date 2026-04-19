from . import dispatcher, geocode, time_window
from .fetchers import (
    calcofi_spray,
    epa_aqi,
    inaturalist,
    noaa_uv,
    snowflake_cluster,
    ucsd_heat,
)

HISTORY_FIELDS = [
    ("recentLocation", "Recent location"),
    ("onsetCategory", "Onset"),
    ("onsetSpecificTiming", "First noticed"),
    ("progression", "Progression"),
    ("symptoms", "Symptoms"),
    ("systemicSymptoms", "Systemic symptoms"),
    ("sunExposure", "Sun exposure"),
    ("plantExposure", "Plant/trail exposure"),
    ("oceanExposure", "Ocean exposure"),
    ("animalExposure", "Animal/insect exposure"),
    ("newMedications", "New medications"),
    ("medicationTypes", "Medication types"),
    ("otcOrHerbalUse", "OTC or herbal remedies"),
    ("previousEpisodes", "Previous episodes"),
    ("immunosuppression", "Immune suppression"),
]


def _format_value(value) -> str:
    if isinstance(value, list):
        return ", ".join(value) if value else ""
    return str(value or "")


def _format_history(form_data: dict) -> str:
    lines = []
    for key, label in HISTORY_FIELDS:
        formatted = _format_value(form_data.get(key))
        if formatted:
            lines.append(f"- {label}: {formatted}")
    return "\n".join(lines) if lines else "- (no history provided)"


def _format_cnn_scores(cnn_scores: dict) -> str:
    lines = []
    for label, score in cnn_scores.items():
        lines.append(f"- {label}: {score * 100:.0f}%")
    return "\n".join(lines)


def _format_env(env_data: dict) -> str:
    if not env_data:
        return "- (no environmental triggers met)"

    lines = []
    for key, payload in env_data.items():
        if "error" in payload:
            lines.append(f"- {key}: {payload['error']}")
            continue
        flat = ", ".join(f"{k}={v}" for k, v in payload.items() if k != "stub")
        stub_tag = " [stub]" if payload.get("stub") else ""
        lines.append(f"- {key}{stub_tag}: {flat}")
    return "\n".join(lines)


def build_context(form_data: dict, cnn_scores: dict) -> str:
    zip_code = form_data.get("zipCode", "")
    latlon = geocode.zip_to_latlon(zip_code)
    window = time_window.derive(form_data)
    selected = dispatcher.select_fetchers(form_data)

    env_data: dict = {}
    if selected.get("noaa_uv"):
        env_data["noaa_uv"] = noaa_uv.fetch(zip_code, window)
    if selected.get("inaturalist"):
        env_data["inaturalist"] = inaturalist.fetch(latlon, window)
    if selected.get("epa_aqi"):
        env_data["epa_aqi"] = epa_aqi.fetch(zip_code, window)
    if selected.get("ucsd_heat"):
        env_data["ucsd_heat"] = ucsd_heat.fetch(latlon, window)
    if selected.get("calcofi_spray"):
        env_data["calcofi_spray"] = calcofi_spray.fetch(latlon, window)
    if selected.get("snowflake_cluster"):
        env_data["snowflake_cluster"] = snowflake_cluster.fetch(zip_code, window)

    return (
        "CNN SCORES:\n"
        f"{_format_cnn_scores(cnn_scores)}\n\n"
        "USER HISTORY:\n"
        f"{_format_history(form_data)}\n\n"
        "ENVIRONMENTAL CONTEXT:\n"
        f"{_format_env(env_data)}\n"
    )
