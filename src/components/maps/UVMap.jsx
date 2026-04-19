import { useMemo } from "react";
import Map from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { useHeatmapData } from "./useHeatmapData";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const UV_COLOR_RANGE = [
  [30, 58, 138],
  [88, 28, 135],
  [168, 85, 247],
  [250, 204, 21],
  [239, 68, 68],
];

const CONTAINER_STYLE = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "hidden",
};

const MAP_FILL = { width: "100%", height: "100%" };

function Overlay({ children }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 10, 20, 0.5)",
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        zIndex: 2,
      }}
    >
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <Overlay>
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid rgba(255,255,255,0.25)",
          borderTopColor: "rgba(255,255,255,0.85)",
          borderRadius: "50%",
          animation: "uvspin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes uvspin { to { transform: rotate(360deg); } }`}</style>
    </Overlay>
  );
}

function UVMap({ zipCode }) {
  const { status, data, center } = useHeatmapData({ source: "uv", zipCode });

  const initialViewState = useMemo(() => {
    if (center) {
      return {
        longitude: center.lon,
        latitude: center.lat,
        zoom: 8,
        pitch: 0,
        bearing: 0,
      };
    }
    return { longitude: -98, latitude: 39, zoom: 3, pitch: 0, bearing: 0 };
  }, [center]);

  const layers = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return [
      new HeatmapLayer({
        id: "uv-heatmap",
        data,
        getPosition: (d) => d.coordinates,
        getWeight: (d) => d.weight,
        radiusPixels: 70,
        intensity: 1,
        threshold: 0.05,
        aggregation: "MEAN",
        colorRange: UV_COLOR_RANGE,
      }),
    ];
  }, [data]);

  return (
    <div style={CONTAINER_STYLE}>
      <DeckGL
        initialViewState={initialViewState}
        controller={{ dragRotate: false, touchRotate: false, keyboard: false }}
        layers={layers}
        style={MAP_FILL}
      >
        <Map mapStyle={MAP_STYLE} reuseMaps attributionControl={{ compact: true }} />
      </DeckGL>
      {status === "loading" ? <Spinner /> : null}
      {status === "error" ? <Overlay>UV data unavailable</Overlay> : null}
    </div>
  );
}

export default UVMap;
