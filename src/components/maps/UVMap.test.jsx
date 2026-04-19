import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children }) => <div data-testid="uv-map">{children}</div>,
  Layer: () => null,
  Source: ({ children }) => <div>{children}</div>,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../lib/uvExposure", async () => {
  const actual = await vi.importActual("../../lib/uvExposure");
  return {
    ...actual,
    fetchNearbyUvPoints: vi.fn(),
  };
});

import UVMap from "./UVMap";
import { fetchNearbyUvPoints } from "../../lib/uvExposure";

afterEach(() => {
  vi.clearAllMocks();
});

describe("UVMap", () => {
  test("renders nearby UV point badge for a valid ZIP", async () => {
    fetchNearbyUvPoints.mockResolvedValue({
      center: { zipCode: "92093", city: "La Jolla", state: "CA", lat: 32.88, lon: -117.23 },
      nearestPoint: {
        zipCode: "92093",
        city: "La Jolla",
        state: "CA",
        lat: 32.88,
        lon: -117.23,
        uvValue: 7,
        label: "High",
        readingTime: "2026-04-19 12 PM",
      },
      points: [
        {
          zipCode: "92093",
          city: "La Jolla",
          state: "CA",
          lat: 32.88,
          lon: -117.23,
          uvValue: 7,
          label: "High",
          readingTime: "2026-04-19 12 PM",
          distanceKm: 0,
        },
      ],
    });

    render(<UVMap zipCode="92093" />);

    expect(await screen.findByText("Nearest UV")).toBeInTheDocument();
    expect(screen.getByText("UV 7")).toBeInTheDocument();
    expect(screen.getAllByText("High").length).toBeGreaterThan(0);
  });

  test("renders unavailable state when ZIP code is missing", () => {
    render(<UVMap zipCode="" />);

    expect(screen.getByText("UV data unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Add a valid ZIP code in the intake/i)).toBeInTheDocument();
  });

  test("renders error state when the nearby UV request fails", async () => {
    fetchNearbyUvPoints.mockRejectedValue(new Error("Request failed"));

    render(<UVMap zipCode="92093" />);

    expect(await screen.findByText("UV data unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't load nearby NOAA\/EPA UV points/i),
    ).toBeInTheDocument();
  });
});
