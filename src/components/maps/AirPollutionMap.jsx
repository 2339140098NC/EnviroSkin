import { useMemo } from "react";
import Map from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { useHeatmapData } from "./useHeatmapData";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

const AQI_COLOR_RANGE = [
  [16, 185, 129],
  [132, 204, 22],
  [250, 204, 21],
  [249, 115, 22],
  [239, 68, 68],
  [124, 58, 237],
];

function Spinner() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 10, 20, 0.45)",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid rgba(255,255,255,0.25)",
          borderTopColor: "rgba(255,255,255,0.85)",
          borderRadius: "50%",
          animation: "mapspin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes mapspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 10, 20, 0.55)",
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
        zIndex: 2,
      }}
    >
      Data unavailable
    </div>
  );
}

function AirPollutionMap({ zipCode }) {
  const { status, data, center } = useHeatmapData({ source: "aqi", zipCode });

  const initialViewState = useMemo(() => {
    if (center) {
      return {
        longitude: center.lon,
        latitude: center.lat,
        zoom: 8.2,
        pitch: 45,
        bearing: -20,
      };
    }
    return { longitude: -98, latitude: 39, zoom: 3, pitch: 45, bearing: -20 };
  }, [center]);

  const layers = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return [
      new HexagonLayer({
        id: "aqi-hexagons",
        data,
        getPosition: (d) => d.coordinates,
        getElevationWeight: (d) => d.weight,
        getColorWeight: (d) => d.weight,
        elevationAggregation: "MEAN",
        colorAggregation: "MEAN",
        radius: 4000,
        elevationScale: 40,
        extruded: true,
        pickable: false,
        coverage: 0.9,
        colorRange: AQI_COLOR_RANGE,
        material: {
          ambient: 0.6,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [255, 255, 255],
        },
        opacity: 0.85,
      }),
    ];
  }, [data]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <DeckGL
        initialViewState={initialViewState}
        controller={{ dragRotate: false, touchRotate: false, keyboard: false }}
        layers={layers}
        style={{ width: "100%", height: "100%" }}
      >
        <Map mapStyle={MAP_STYLE} reuseMaps attributionControl={{ compact: true }} />
      </DeckGL>
      {status === "loading" ? <Spinner /> : null}
      {status === "error" ? <ErrorOverlay /> : null}
    </div>
  );
}

export default AirPollutionMap;
