import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import UVMap from "./UVMap";

describe("UVMap", () => {
  test("renders NOAA UV trend content when hourly forecast is available", () => {
    render(
      <UVMap
        zipCode="92093"
        noaaUv={{
          uv_index: 8,
          category: "Very High",
          hour: "2026-04-19 13:00",
          hourly_forecast: [
            { hour_24: 8, label: "8:00 AM", uv_value: 1, category: "Low", date_time: "x" },
            { hour_24: 10, label: "10:00 AM", uv_value: 4, category: "Moderate", date_time: "y" },
            { hour_24: 13, label: "1:00 PM", uv_value: 8, category: "Very High", date_time: "z" },
          ],
        }}
      />,
    );

    expect(screen.getByText("Peak window")).toBeInTheDocument();
    expect(screen.getAllByText("UV 8").length).toBeGreaterThan(0);
    expect(screen.getByText("1:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Readings loaded")).toBeInTheDocument();
  });

  test("renders unavailable state when ZIP code is missing", () => {
    render(<UVMap zipCode="" noaaUv={null} />);

    expect(screen.getByText("UV data unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Add a valid ZIP code in the intake/i)).toBeInTheDocument();
  });

  test("renders error state when NOAA UV context has an error", () => {
    render(<UVMap zipCode="92093" noaaUv={{ error: "fetch failed" }} />);

    expect(screen.getByText("UV data unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't load the NOAA UV timeline/i),
    ).toBeInTheDocument();
  });
});
