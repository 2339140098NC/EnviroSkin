import { useMemo } from "react";
import Map from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { useHeatmapData } from "./useHeatmapData";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const UV_STOPS = [
  { at: 0, color: [30, 58, 138] },
  { at: 3, color: [88, 28, 135] },
  { at: 6, color: [168, 85, 247] },
  { at: 8, color: [250, 204, 21] },
  { at: 11, color: [239, 68, 68] },
];

function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function colorForUV(uv) {
  const v = Math.max(0, Math.min(11, uv));
  for (let i = 0; i < UV_STOPS.length - 1; i += 1) {
    const s = UV_STOPS[i];
    const e = UV_STOPS[i + 1];
    if (v >= s.at && v <= e.at) {
      const t = (v - s.at) / (e.at - s.at);
      return lerpColor(s.color, e.color, t);
    }
  }
  return UV_STOPS[UV_STOPS.length - 1].color;
}

function uvRiskLabel(uv) {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

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

function UVBadge({ uv }) {
  const color = colorForUV(uv);
  const rgb = `${color[0]}, ${color[1]}, ${color[2]}`;
  const risk = uvRiskLabel(uv);
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${rgb}, 0.5) 0%, rgba(${rgb}, 0.15) 55%, rgba(${rgb}, 0) 100%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: "rgba(10, 10, 20, 0.72)",
          border: `2px solid rgba(${rgb}, 0.95)`,
          boxShadow: `0 0 32px rgba(${rgb}, 0.7), inset 0 0 20px rgba(${rgb}, 0.35)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "rgba(255,255,255,0.98)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {uv.toFixed(1)}
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginTop: 4,
          }}
        >
          UV Index
        </div>
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          fontWeight: 700,
          color: `rgb(${rgb})`,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          textShadow: "0 1px 6px rgba(0,0,0,0.9)",
        }}
      >
        {risk}
      </div>
    </div>
  );
}

function CompassCard({ label, uv, style }) {
  const color = colorForUV(uv);
  const rgb = `${color[0]}, ${color[1]}, ${color[2]}`;
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        minWidth: 46,
        borderRadius: 10,
        background: "rgba(10, 10, 20, 0.62)",
        border: `1px solid rgba(${rgb}, 0.55)`,
        boxShadow: `0 0 12px rgba(${rgb}, 0.25), 0 2px 8px rgba(0,0,0,0.4)`,
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
        zIndex: 3,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.18em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: `rgb(${rgb})`,
            boxShadow: `0 0 6px rgba(${rgb}, 0.8)`,
          }}
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
            lineHeight: 1,
          }}
        >
          {uv.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function nearestWeight(points, lat, lon) {
  let best = null;
  let bestD = Infinity;
  points.forEach((p) => {
    const dx = p.coordinates[0] - lon;
    const dy = p.coordinates[1] - lat;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  });
  return best?.weight ?? null;
}

function UVMap({ zipCode }) {
  const { status, data, center } = useHeatmapData({ source: "uv", zipCode });

  const avgUV = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const sum = data.reduce((acc, d) => acc + (d.weight || 0), 0);
    return sum / data.length;
  }, [data]);

  const compass = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0 || !center) return null;
    const offset = 0.35;
    const cosLat = Math.max(0.2, Math.cos((center.lat * Math.PI) / 180));
    return {
      N: nearestWeight(data, center.lat + offset, center.lon),
      S: nearestWeight(data, center.lat - offset, center.lon),
      E: nearestWeight(data, center.lat, center.lon + offset / cosLat),
      W: nearestWeight(data, center.lat, center.lon - offset / cosLat),
    };
  }, [data, center]);

  const initialViewState = useMemo(() => {
    if (center) {
      return {
        longitude: center.lon,
        latitude: center.lat,
        zoom: 8.2,
        pitch: 0,
        bearing: 0,
      };
    }
    return { longitude: -98, latitude: 39, zoom: 3, pitch: 0, bearing: 0 };
  }, [center]);

  const layers = useMemo(() => {
    if (!center || avgUV == null) return [];
    const color = colorForUV(avgUV);
    return [
      new ScatterplotLayer({
        id: "uv-aura-outer",
        data: [{ position: [center.lon, center.lat] }],
        getPosition: (d) => d.position,
        getRadius: 24000,
        getFillColor: [...color, 22],
        radiusUnits: "meters",
        stroked: false,
        filled: true,
        parameters: { depthTest: false },
      }),
      new ScatterplotLayer({
        id: "uv-aura-inner",
        data: [{ position: [center.lon, center.lat] }],
        getPosition: (d) => d.position,
        getRadius: 12000,
        getFillColor: [...color, 55],
        radiusUnits: "meters",
        stroked: false,
        filled: true,
        parameters: { depthTest: false },
      }),
    ];
  }, [center, avgUV]);

  const ready = status === "ready" && avgUV != null;

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
      {ready && compass?.N != null ? (
        <CompassCard label="N" uv={compass.N} style={{ top: 14, left: "50%", transform: "translateX(-50%)" }} />
      ) : null}
      {ready && compass?.S != null ? (
        <CompassCard label="S" uv={compass.S} style={{ bottom: 14, left: "50%", transform: "translateX(-50%)" }} />
      ) : null}
      {ready && compass?.E != null ? (
        <CompassCard label="E" uv={compass.E} style={{ right: 14, top: "50%", transform: "translateY(-50%)" }} />
      ) : null}
      {ready && compass?.W != null ? (
        <CompassCard label="W" uv={compass.W} style={{ left: 14, top: "50%", transform: "translateY(-50%)" }} />
      ) : null}
      {ready ? <UVBadge uv={avgUV} /> : null}
      {status === "loading" ? <Spinner /> : null}
      {status === "error" ? <ErrorOverlay /> : null}
    </div>
  );
}

export default UVMap;
