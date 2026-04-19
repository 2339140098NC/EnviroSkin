const ZIP_API_BASE = "https://api.zippopotam.us";
const EPA_UV_BASE = "https://data.epa.gov/dmapservice/getEnvirofactsUVHOURLY/ZIP";

function normalizeZip(zipCode) {
  return String(zipCode || "").trim();
}

function parseNumber(value) {
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * r * Math.asin(Math.sqrt(a));
}

export function getUvLabel(uvValue) {
  const uv = Number(uvValue);
  if (!Number.isFinite(uv) || uv < 0) {
    return "Unavailable";
  }
  if (uv <= 2) {
    return "Low";
  }
  if (uv <= 5) {
    return "Moderate";
  }
  if (uv <= 7) {
    return "High";
  }
  if (uv <= 10) {
    return "Very High";
  }
  return "Extreme";
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function geocodeZip(zipCode) {
  const normalized = normalizeZip(zipCode);
  if (!/^\d{5}$/.test(normalized)) {
    throw new Error("ZIP code must be a 5-digit US ZIP code");
  }

  const payload = await fetchJson(`${ZIP_API_BASE}/us/${normalized}`);
  const place = payload?.places?.[0];

  if (!place) {
    throw new Error(`No location found for ZIP ${normalized}`);
  }

  const lat = parseNumber(place.latitude);
  const lon = parseNumber(place.longitude);

  if (lat === null || lon === null) {
    throw new Error(`Invalid geocode returned for ZIP ${normalized}`);
  }

  return {
    zipCode: normalized,
    lat,
    lon,
    city: place["place name"] || null,
    state: place["state abbreviation"] || place.state || null,
  };
}

function normalizeNearbyZipPayload(payload) {
  const places = Array.isArray(payload?.places)
    ? payload.places
    : Array.isArray(payload)
      ? payload
      : [];

  return places
    .map((place) => {
      const zipCode =
        place["post code"] ||
        place.postCode ||
        place.postcode ||
        place.zip ||
        place.ZIP ||
        null;
      const lat = parseNumber(place.latitude);
      const lon = parseNumber(place.longitude);

      if (!zipCode || lat === null || lon === null) {
        return null;
      }

      return {
        zipCode: String(zipCode).trim(),
        lat,
        lon,
        city: place["place name"] || place.city || null,
        state: place["state abbreviation"] || place.state || null,
      };
    })
    .filter(Boolean);
}

export async function fetchNearbyZipPlaces(zipCode) {
  const normalized = normalizeZip(zipCode);
  const payload = await fetchJson(`${ZIP_API_BASE}/nearby/us/${normalized}`);
  return normalizeNearbyZipPayload(payload);
}

function parseEpaDateTime(value) {
  if (!value) {
    return null;
  }

  const plain = Date.parse(value);
  if (Number.isFinite(plain)) {
    return plain;
  }

  const withLocal = Date.parse(`${value} GMT`);
  return Number.isFinite(withLocal) ? withLocal : null;
}

export async function fetchEpaUvHourly(zipCode) {
  const normalized = normalizeZip(zipCode);
  const rows = await fetchJson(`${EPA_UV_BASE}/${normalized}/JSON`);

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`No UV rows returned for ZIP ${normalized}`);
  }

  const now = Date.now();
  let best = null;

  for (const row of rows) {
    const uvValue = Number.parseInt(String(row?.UV_VALUE ?? ""), 10);
    const timestamp = parseEpaDateTime(row?.DATE_TIME);

    if (!Number.isFinite(uvValue) || timestamp === null) {
      continue;
    }

    const diff = Math.abs(timestamp - now);
    if (!best || diff < best.diff) {
      best = {
        diff,
        uvValue,
        readingTime: row.DATE_TIME || "",
      };
    }
  }

  if (!best) {
    throw new Error(`No valid UV readings returned for ZIP ${normalized}`);
  }

  return {
    zipCode: normalized,
    uvValue: best.uvValue,
    label: getUvLabel(best.uvValue),
    readingTime: best.readingTime,
  };
}

export async function queryNearbyUvPoints({
  zipCode,
  maxDistanceKm = 60,
  maxPoints = 8,
}) {
  const center = await geocodeZip(zipCode);

  let nearbyPlaces = [];
  try {
    nearbyPlaces = await fetchNearbyZipPlaces(center.zipCode);
  } catch {
    nearbyPlaces = [];
  }

  const byZip = new Map();
  [center, ...nearbyPlaces].forEach((place) => {
    if (place?.zipCode && !byZip.has(place.zipCode)) {
      byZip.set(place.zipCode, place);
    }
  });

  const candidatePlaces = [...byZip.values()]
    .map((place) => ({
      ...place,
      distanceKm: haversineKm(center.lat, center.lon, place.lat, place.lon),
    }))
    .filter((place) => place.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxPoints);

  const settled = await Promise.allSettled(
    candidatePlaces.map(async (place) => {
      const reading = await fetchEpaUvHourly(place.zipCode);
      return {
        ...place,
        ...reading,
      };
    }),
  );

  const points = settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (points.length === 0) {
    throw new Error("No nearby NOAA/EPA UV points were available for this ZIP code");
  }

  return {
    center,
    nearestPoint: points[0],
    points,
  };
}

