import requests

IRRITANT_TAXA = {
    "Toxicodendron diversilobum (poison oak)": 58732,
    "Toxicodendron radicans (poison ivy)": 58731,
    "Toxicodendron vernix (poison sumac)": 58733,
    "Urtica dioica (stinging nettle)": 55925,
}


def fetch(latlon: tuple[float, float] | None, time_window=None) -> dict:
    if not latlon:
        return {"error": "no coordinates available"}

    lat, lon = latlon
    taxon_ids = ",".join(str(tid) for tid in IRRITANT_TAXA.values())
    params = {
        "lat": lat,
        "lng": lon,
        "radius": 25,
        "taxon_id": taxon_ids,
        "per_page": 50,
    }
    if time_window:
        start, end = time_window
        params["d1"] = start.strftime("%Y-%m-%d")
        params["d2"] = end.strftime("%Y-%m-%d")

    try:
        response = requests.get(
            "https://api.inaturalist.org/v1/observations",
            params=params,
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        return {"error": f"iNaturalist fetch failed: {exc}"}

    results = data.get("results", [])
    counts: dict[str, int] = {}
    for obs in results:
        taxon = obs.get("taxon") or {}
        name = taxon.get("preferred_common_name") or taxon.get("name") or "unknown"
        counts[name] = counts.get(name, 0) + 1

    species = [{"name": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
    return {
        "irritant_species_nearby": species,
        "total_observations": data.get("total_results", len(results)),
    }
