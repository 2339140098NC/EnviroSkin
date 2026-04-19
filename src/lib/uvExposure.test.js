import { describe, expect, test } from "vitest";
import {
  buildUvBounds,
  buildUvGeoJson,
  getUvColor,
  getUvLabel,
} from "./uvExposure";

describe("uvExposure helpers", () => {
  test("maps UV values to labels", () => {
    expect(getUvLabel(1)).toBe("Low");
    expect(getUvLabel(4)).toBe("Moderate");
    expect(getUvLabel(7)).toBe("High");
    expect(getUvLabel(9)).toBe("Very High");
    expect(getUvLabel(11)).toBe("Extreme");
  });

  test("maps UV values to display colors", () => {
    expect(getUvColor(1)).toBe("#7dd3fc");
    expect(getUvColor(4)).toBe("#22d3ee");
    expect(getUvColor(7)).toBe("#fbbf24");
    expect(getUvColor(9)).toBe("#fb923c");
    expect(getUvColor(11)).toBe("#f43f5e");
  });

  test("builds GeoJSON features from UV points", () => {
    const geoJson = buildUvGeoJson([
      {
        zipCode: "92093",
        city: "La Jolla",
        state: "CA",
        lat: 32.88,
        lon: -117.23,
        uvValue: 7,
        label: "High",
        readingTime: "2026-04-19 12 PM",
      },
    ]);

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0].properties.uvValue).toBe(7);
    expect(geoJson.features[0].geometry.coordinates).toEqual([-117.23, 32.88]);
  });

  test("builds bounds that include points and center", () => {
    const bounds = buildUvBounds(
      [
        { lon: -117.3, lat: 32.8 },
        { lon: -117.1, lat: 32.9 },
      ],
      { lon: -117.2, lat: 32.85 },
    );

    expect(bounds).toHaveLength(2);
    expect(bounds[0][0]).toBeLessThan(-117.3);
    expect(bounds[1][1]).toBeGreaterThan(32.9);
  });
});
