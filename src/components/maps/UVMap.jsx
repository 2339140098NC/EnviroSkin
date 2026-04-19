import { useMemo } from "react";
import { getUvColor, getUvLabel } from "../../lib/uvExposure";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function getColorForLabel(label) {
  switch (label) {
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

function StatusPanel({ title, body }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(135deg,_rgba(239,246,255,0.96),_rgba(248,250,252,0.88)_55%,_rgba(224,242,254,0.9))] px-6 text-center">
      <div className="max-w-sm rounded-[1.35rem] border border-white/65 bg-white/72 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">{body}</p>
      </div>
    </div>
  );
}

function Bar({ entry, index, maxUv }) {
  const height = Math.max(10, Math.round((entry.uv_value / maxUv) * 122));
  const color = getUvColor(entry.uv_value);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
      <div className="flex h-36 items-end">
        <div
          className="relative w-full min-w-[14px] overflow-hidden rounded-[999px] border border-white/55 bg-white/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_12px_24px_rgba(148,163,184,0.14)]"
          style={{
            height: `${height}px`,
            background: `linear-gradient(180deg, ${color}, ${color}CC 55%, ${color}B3)`,
            animation: `uv-bar-rise 520ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 45}ms both`,
          }}
          title={`${entry.label} - UV ${entry.uv_value}`}
        >
          <span className="absolute inset-x-1 top-1 h-4 rounded-full bg-white/18 blur-[2px]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-semibold tracking-[0.04em] text-slate-600">
          {entry.label.replace(":00 ", "")}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">UV {entry.uv_value}</p>
      </div>
    </div>
  );
}

function LegendPill({ label }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/55 bg-white/42 px-2.5 py-1.5 shadow-[0_8px_20px_rgba(148,163,184,0.1)]">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: getColorForLabel(label) }}
      />
      <span className="text-[11px] font-medium text-slate-600">{label}</span>
    </div>
  );
}

function UVMap({ zipCode, noaaUv }) {
  const hourlyForecast = useMemo(() => {
    const rows = Array.isArray(noaaUv?.hourly_forecast) ? noaaUv.hourly_forecast : [];
    return rows.filter((row) => Number.isFinite(row?.uv_value));
  }, [noaaUv?.hourly_forecast]);

  const peakReading = useMemo(() => {
    if (hourlyForecast.length === 0) {
      return null;
    }
    return hourlyForecast.reduce((peak, entry) =>
      !peak || entry.uv_value > peak.uv_value ? entry : peak,
    null);
  }, [hourlyForecast]);

  const currentLabel = noaaUv?.category || getUvLabel(noaaUv?.uv_index);
  const maxUv = Math.max(...hourlyForecast.map((entry) => entry.uv_value), 1);

  if (!/^\d{5}$/.test(String(zipCode || "").trim())) {
    return (
      <StatusPanel
        title="UV data unavailable"
        body="Add a valid ZIP code in the intake to load the NOAA UV trend for this day."
      />
    );
  }

  if (noaaUv?.error) {
    return (
      <StatusPanel
        title="UV data unavailable"
        body="We couldn't load the NOAA UV timeline for this ZIP code right now."
      />
    );
  }

  if (hourlyForecast.length === 0) {
    return (
      <StatusPanel
        title="UV data unavailable"
        body="No daytime NOAA UV readings were available between 8 AM and 8 PM for this ZIP code."
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(135deg,_rgba(239,246,255,0.96),_rgba(248,250,252,0.88)_55%,_rgba(224,242,254,0.9))]">
      <style>
        {`
          @keyframes uv-bar-rise {
            from { transform: scaleY(0.18) translateY(14px); opacity: 0; transform-origin: bottom; }
            to { transform: scaleY(1) translateY(0); opacity: 1; transform-origin: bottom; }
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/42 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-sky-100/38 via-white/8 to-transparent" />

      <div className="relative flex h-full flex-col px-5 py-4">
       
        <div className="mt-94 grid grid-cols-2 gap-3">
          <div className="rounded-[1rem] border border-white/55 bg-white/48 px-3.5 py-2.5 shadow-[0_12px_24px_rgba(148,163,184,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Peak window
            </p>
            <p className="mt-1.5 text-sm font-semibold text-ink">
              {peakReading?.label || "Unavailable"}
            </p>
          </div>
          <div className="rounded-[1rem] border border-white/55 bg-white/48 px-3.5 py-2.5 shadow-[0_12px_24px_rgba(148,163,184,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Readings loaded
            </p>
            <p className="mt-1.5 text-sm font-semibold text-ink">{hourlyForecast.length}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.2rem] border border-white/55 bg-white/40 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_18px_34px_rgba(148,163,184,0.1)]">
          <div className="flex h-full items-end gap-2">
            {hourlyForecast.map((entry, index) => (
              <Bar
                key={`${entry.hour_24}-${entry.date_time}`}
                entry={entry}
                index={index}
                maxUv={maxUv}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Low", "Moderate", "High", "Very High", "Extreme"].map((label) => (
            <LegendPill key={label} label={label} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default UVMap;
