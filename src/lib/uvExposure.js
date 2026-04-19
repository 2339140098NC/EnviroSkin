export function getUvLabel(value) {
  const uv = Number(value);
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

export function getUvColor(value) {
  switch (getUvLabel(value)) {
    case "Low":
      return "#7dd3fc";
    case "Moderate":
      return "#22d3ee";
    case "High":
      return "#fbbf24";
    case "Very High":
      return "#fb923c";
    case "Extreme":
      return "#f43f5e";
    default:
      return "#94a3b8";
  }
}

export function buildUvGeoJson(points) {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      id: point.zipCode,
      geometry: {
        type: "Point",
        coordinates: [point.lon, point.lat],
      },
      properties: {
        zipCode: point.zipCode,
        city: point.city || "",
        state: point.state || "",
        uvValue: point.uvValue,
        label: point.label || getUvLabel(point.uvValue),
        readingTime: point.readingTime || "",
        distanceKm: point.distanceKm ?? null,
      },
    })),
  };
}

export function buildUvBounds(points, center) {
  const coordinates = [
    ...(Array.isArray(points) ? points.map((point) => [point.lon, point.lat]) : []),
    center ? [center.lon, center.lat] : null,
  ].filter(Boolean);

  if (coordinates.length === 0) {
    return null;
  }

  const [firstLon, firstLat] = coordinates[0];
  const bounds = {
    minLon: firstLon,
    maxLon: firstLon,
    minLat: firstLat,
    maxLat: firstLat,
  };

  coordinates.forEach(([lon, lat]) => {
    bounds.minLon = Math.min(bounds.minLon, lon);
    bounds.maxLon = Math.max(bounds.maxLon, lon);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
  });

  const lonPadding = Math.max(0.05, (bounds.maxLon - bounds.minLon) * 0.35);
  const latPadding = Math.max(0.05, (bounds.maxLat - bounds.minLat) * 0.35);

  return [
    [bounds.minLon - lonPadding, bounds.minLat - latPadding],
    [bounds.maxLon + lonPadding, bounds.maxLat + latPadding],
  ];
}

export async function fetchNearbyUvPoints(zipCode) {
  const normalized = String(zipCode || "").trim();
  if (!/^\d{5}$/.test(normalized)) {
    throw new Error("Invalid ZIP code");
  }

  const response = await fetch(`/api/uv/points?zip=${encodeURIComponent(normalized)}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `UV request failed with status ${response.status}`);
  }

  if (!payload?.center || !Array.isArray(payload?.points)) {
    throw new Error("Invalid UV response payload");
  }

  return payload;
}

