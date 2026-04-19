import { useEffect, useState } from "react";

export async function zipToLatLon(zipCode) {
  if (!zipCode) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lon: parseFloat(place.longitude),
    };
  } catch {
    return null;
  }
}

function buildGrid(lat, lon, gridSize, stepDeg) {
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const lonStep = stepDeg / cosLat;
  const half = (gridSize - 1) / 2;
  const points = [];
  for (let i = -half; i <= half; i += 1) {
    for (let j = -half; j <= half; j += 1) {
      points.push([lat + i * stepDeg, lon + j * lonStep]);
    }
  }
  return points;
}

function pickCurrentHourValue(entry, variable) {
  const times = entry?.hourly?.time || [];
  const values = entry?.hourly?.[variable] || [];
  if (!times.length || !values.length) return null;
  const now = new Date();
  const nowIso = now.toISOString().slice(0, 13);
  let bestIdx = 0;
  let bestDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now.getTime());
    if (t.startsWith(nowIso)) {
      bestIdx = i;
      bestDiff = 0;
    } else if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  });
  return values[bestIdx];
}

async function fetchOpenMeteoGridded({ points, endpoint, variable, forecastDays = 1 }) {
  const lats = points.map((p) => p[0].toFixed(4)).join(",");
  const lons = points.map((p) => p[1].toFixed(4)).join(",");
  const url = `${endpoint}?latitude=${lats}&longitude=${lons}&hourly=${variable}&timezone=auto&forecast_days=${forecastDays}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${endpoint} ${res.status}`);
  const payload = await res.json();
  const series = Array.isArray(payload) ? payload : [payload];
  const out = [];
  series.forEach((entry, idx) => {
    const v = pickCurrentHourValue(entry, variable);
    if (typeof v !== "number" || Number.isNaN(v) || v < 0) return;
    out.push({
      coordinates: [points[idx][1], points[idx][0]],
      weight: v,
    });
  });
  return out;
}

export function useHeatmapData({ source, zipCode }) {
  const [state, setState] = useState({
    status: "idle",
    data: null,
    center: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!zipCode) {
      setState({ status: "error", data: null, center: null, error: "No zip code" });
      return () => {
        cancelled = true;
      };
    }
    setState({ status: "loading", data: null, center: null, error: null });

    (async () => {
      const center = await zipToLatLon(zipCode);
      if (cancelled) return;
      if (!center) {
        setState({ status: "error", data: null, center: null, error: "Geocode failed" });
        return;
      }
      try {
        const grid = buildGrid(center.lat, center.lon, 11, 0.09);
        let data;
        if (source === "uv") {
          data = await fetchOpenMeteoGridded({
            points: grid,
            endpoint: "https://api.open-meteo.com/v1/forecast",
            variable: "uv_index",
          });
        } else if (source === "aqi") {
          data = await fetchOpenMeteoGridded({
            points: grid,
            endpoint: "https://air-quality-api.open-meteo.com/v1/air-quality",
            variable: "us_aqi",
          });
        } else {
          data = [];
        }
        if (cancelled) return;
        if (!data || data.length === 0) {
          setState({
            status: "error",
            data: null,
            center,
            error: "No data returned",
          });
          return;
        }
        setState({ status: "ready", data, center, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          data: null,
          center,
          error: err?.message || "Fetch failed",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, zipCode]);

  return state;
}
