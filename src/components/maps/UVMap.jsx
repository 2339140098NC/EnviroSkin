import { useEffect, useMemo, useState } from "react";
import Map, { Layer, Marker, Popup, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  buildUvBounds,
  buildUvGeoJson,
  fetchNearbyUvPoints,
  getUvColor,
} from "../../lib/uvExposure";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

const UV_POINT_LAYER = {
  id: "uv-points",
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "uvValue"],
      0,
      6,
      3,
      8,
      6,
      10,
      8,
      12,
      10,
      14,
    ],
    "circle-color": [
      "match",
      ["get", "label"],
      "Low",
      "#7dd3fc",
      "Moderate",
      "#22d3ee",
      "High",
      "#fbbf24",
      "Very High",
      "#fb923c",
      "Extreme",
      "#f43f5e",
      "#94a3b8",
    ],
    "circle-opacity": 0.9,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "rgba(255,255,255,0.8)",
    "circle-blur": 0.08,
  },
};

const LEGEND_ITEMS = [
  { label: "Low", color: "#7dd3fc" },
  { label: "Moderate", color: "#22d3ee" },
  { label: "High", color: "#fbbf24" },
  { label: "Very High", color: "#fb923c" },
  { label: "Extreme", color: "#f43f5e" },
];

function UserMarker() {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <span className="absolute h-6 w-6 rounded-full bg-sky-300/18" />
      <span className="absolute h-4.5 w-4.5 rounded-full border border-sky-300/50 bg-sky-300/16 shadow-[0_0_0_6px_rgba(125,211,252,0.08)]" />
      <span className="absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-sky-500 shadow-[0_4px_14px_rgba(14,165,233,0.28)]" />
    </div>
  );
}

function OverlayMessage({ title, body, loading = false }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/26 backdrop-blur-[2px]">
      <div className="rounded-[1.35rem] border border-white/65 bg-white/72 px-5 py-4 text-center shadow-[0_18px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        {loading ? (
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-[2.5px] border-slate-300 border-t-sky-500" />
        ) : null}
        <p className="mt-0 text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1.5 max-w-[15rem] text-xs leading-5 text-slate-600">{body}</p>
      </div>
    </div>
  );
}

function UVMap({ zipCode }) {
  const [state, setState] = useState({
    status: "idle",
    payload: null,
    error: "",
  });
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!/^\d{5}$/.test(String(zipCode || "").trim())) {
      setState({
        status: "unavailable",
        payload: null,
        error: "Add a valid ZIP code in the intake to load nearby NOAA/EPA UV points.",
      });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: "loading", payload: null, error: "" });
    setSelectedPoint(null);

    (async () => {
      try {
        const payload = await fetchNearbyUvPoints(zipCode);
        if (cancelled) {
          return;
        }
        setState({ status: "ready", payload, error: "" });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState({
          status: "error",
          payload: null,
          error:
            error instanceof Error && error.message
              ? error.message
              : "Unable to load nearby UV points.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [zipCode]);

  const center = state.payload?.center || null;
  const points = state.payload?.points || [];
  const nearestPoint = state.payload?.nearestPoint || null;

  const geoJson = useMemo(
    () => (points.length > 0 ? buildUvGeoJson(points) : null),
    [points],
  );

  const initialViewState = useMemo(() => {
    const bounds = buildUvBounds(points, center);
    if (bounds) {
      return {
        bounds,
        fitBoundsOptions: {
          padding: 56,
        },
      };
    }

    if (center) {
      return {
        longitude: center.lon,
        latitude: center.lat,
        zoom: 9.5,
      };
    }

    return {
      longitude: -98,
      latitude: 39,
      zoom: 3.2,
    };
  }, [center, points]);

  const handleMapClick = (event) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelectedPoint(null);
      return;
    }

    setSelectedPoint({
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      ...feature.properties,
    });
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Map
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE}
        reuseMaps
        attributionControl={false}
        dragRotate={false}
        touchZoomRotate={false}
        doubleClickZoom={false}
        interactiveLayerIds={["uv-points"]}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        {geoJson ? (
          <Source id="uv-source" type="geojson" data={geoJson}>
            <Layer {...UV_POINT_LAYER} />
          </Source>
        ) : null}

        {center ? (
          <Marker longitude={center.lon} latitude={center.lat} anchor="center">
            <UserMarker />
          </Marker>
        ) : null}

        {selectedPoint ? (
          <Popup
            longitude={selectedPoint.longitude}
            latitude={selectedPoint.latitude}
            anchor="top"
            offset={16}
            closeButton={false}
            onClose={() => setSelectedPoint(null)}
            className="uv-map-popup"
          >
            <div className="min-w-[12rem] px-1 py-1">
              <p className="text-sm font-semibold text-ink">
                {selectedPoint.city || "Nearby UV point"}
                {selectedPoint.state ? `, ${selectedPoint.state}` : ""}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                ZIP {selectedPoint.zipCode}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                UV {selectedPoint.uvValue} · {selectedPoint.label}
              </p>
              {selectedPoint.readingTime ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {selectedPoint.readingTime}
                </p>
              ) : null}
            </div>
          </Popup>
        ) : null}
      </Map>

      <style>
        {`
          .uv-map-popup .maplibregl-popup-content {
            border: 1px solid rgba(255, 255, 255, 0.7);
            border-radius: 18px;
            background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.78));
            box-shadow: 0 24px 50px rgba(15,23,42,0.14);
            backdrop-filter: blur(18px);
          }
          .uv-map-popup .maplibregl-popup-tip {
            border-top-color: rgba(255,255,255,0.9);
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(239,246,255,0.28),rgba(255,255,255,0.02)_35%,rgba(255,255,255,0.02)_65%,rgba(224,242,254,0.18))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-white/34 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-sky-100/34 via-white/8 to-transparent" />

      <div className="absolute left-4 top-4 z-30 rounded-full border border-white/65 bg-white/72 px-4 py-2 shadow-[0_14px_30px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]"
            style={{
              backgroundColor: nearestPoint ? getUvColor(nearestPoint.uvValue) : "#94a3b8",
              color: nearestPoint ? getUvColor(nearestPoint.uvValue) : "#94a3b8",
            }}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Nearest UV
            </p>
            <p className="text-sm font-semibold text-ink">
              {nearestPoint ? `UV ${nearestPoint.uvValue}` : "UV -"}{" "}
              <span className="text-slate-500">·</span>{" "}
              <span className="text-slate-600">{nearestPoint?.label || "Unavailable"}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-30 rounded-[1rem] border border-white/60 bg-white/68 px-3 py-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex min-w-fit items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {state.status === "loading" ? (
        <OverlayMessage
          title="Preparing UV map"
          body="Loading nearby NOAA and EPA UV points for the intake ZIP code."
          loading
        />
      ) : null}

      {state.status === "unavailable" ? (
        <OverlayMessage title="UV data unavailable" body={state.error} />
      ) : null}

      {state.status === "error" ? (
        <OverlayMessage
          title="UV data unavailable"
          body="We couldn't load nearby NOAA/EPA UV points for this ZIP code right now."
        />
      ) : null}
    </div>
  );
}

export default UVMap;
