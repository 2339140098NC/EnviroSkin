import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";

const DATA_ROOT = path.resolve(process.cwd(), "CalCOFI Data");
const ZIP_GEOCODE_URL = "https://api.zippopotam.us/us";

let observationCache = null;
let loadingPromise = null;

function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function parseCalcofiTimestamp(value) {
  if (!value) {
    return null;
  }

  const utcMillis = Date.parse(`${value} UTC`);
  if (Number.isFinite(utcMillis)) {
    return utcMillis;
  }

  const plainMillis = Date.parse(value);
  return Number.isFinite(plainMillis) ? plainMillis : null;
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

function average(values) {
  const valid = values.filter((n) => Number.isFinite(n));
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, n) => sum + n, 0) / valid.length;
}

async function walkFiles(dirPath, output) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(fullPath, output);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
      output.push(fullPath);
    }
  }
}

async function loadCsvObservations(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    parser.on("readable", () => {
      let record;
      while ((record = parser.read()) !== null) {
        const lat = toNumber(record.Lat_Dec);
        const lon = toNumber(record.Lon_Dec);
        const timestamp = parseCalcofiTimestamp(record.Date_Time_UTC);

        if (lat === null || lon === null || timestamp === null) {
          continue;
        }

        rows.push({
          sourceFile: path.relative(DATA_ROOT, filePath),
          castId: record.Cast_ID || null,
          stationId: record.Sta_ID || null,
          line: record.Line || null,
          station: record.Sta || null,
          observedAtUtc: timestamp,
          lat,
          lon,
          depthM: firstNumber(record.Depth, record.BTL_Depth),
          tempC: firstNumber(record.TempAve, record.BTL_Temp, record.Temp1, record.Temp2),
          salinity: firstPositiveNumber(
            record.SaltAve_Corr,
            record.Salt1_Corr,
            record.Salt2_Corr,
            record.Salt1,
            record.Salt2,
            record.SaltB,
          ),
          oxygenUmolKg: firstPositiveNumber(
            record.OxAveuM_StaCorr,
            record.Ox1uM_StaCorr,
            record.Ox2uM_StaCorr,
            record.Ox1uM_CruiseCorr,
            record.Ox2uM_CruiseCorr,
            record.Ox1uM,
            record.Ox2uM,
            record.OxBuM,
          ),
          nitrateEst: firstNumber(
            record.EstNO3_StaCorr,
            record.EstNO3_CruiseCorr,
            record.NO3,
          ),
          chlorophyllEst: firstNumber(
            record.EstChl_StaCorr,
            record.EstChl_CruiseCorr,
            record["Chl-a"],
          ),
        });
      }
    });

    parser.on("error", reject);
    parser.on("end", () => resolve(rows));

    fs.createReadStream(filePath).pipe(parser);
  });
}

export async function loadCalcofiData() {
  if (observationCache) {
    return observationCache;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    if (!fs.existsSync(DATA_ROOT)) {
      throw new Error(`CalCOFI data directory not found: ${DATA_ROOT}`);
    }

    const csvFiles = [];
    await walkFiles(DATA_ROOT, csvFiles);

    const observations = [];
    for (const filePath of csvFiles) {
      const rows = await loadCsvObservations(filePath);
      observations.push(...rows);
    }

    observationCache = observations;
    return observationCache;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function geocodeZip(zipCode) {
  const response = await fetch(`${ZIP_GEOCODE_URL}/${zipCode}`);
  if (!response.ok) {
    throw new Error(`Unable to geocode ZIP ${zipCode}: HTTP ${response.status}`);
  }

  const data = await response.json();
  const firstPlace = data?.places?.[0];
  if (!firstPlace) {
    throw new Error(`No geocode result for ZIP ${zipCode}`);
  }

  const lat = Number(firstPlace.latitude);
  const lon = Number(firstPlace.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid geocode result for ZIP ${zipCode}`);
  }

  return {
    zipCode,
    lat,
    lon,
    city: firstPlace["place name"] || null,
    state: firstPlace["state abbreviation"] || firstPlace.state || null,
  };
}

export async function queryCalcofiContext({
  zipCode,
  targetDate,
  maxDistanceKm = 300,
  maxResults = 100,
  windowDays = 180,
  rankBy = "balanced",
}) {
  const geocode = await geocodeZip(zipCode);
  const observations = await loadCalcofiData();

  const targetMillis = targetDate ? Date.parse(targetDate) : Date.now();
  const validTargetMillis = Number.isFinite(targetMillis) ? targetMillis : Date.now();
  const windowMillis = windowDays * 24 * 60 * 60 * 1000;

  const candidates = [];

  for (const obs of observations) {
    const distanceKm = haversineKm(geocode.lat, geocode.lon, obs.lat, obs.lon);
    if (distanceKm > maxDistanceKm) {
      continue;
    }

    const lagMillis = Math.abs(obs.observedAtUtc - validTargetMillis);
    if (lagMillis > windowMillis) {
      continue;
    }

    candidates.push({
      ...obs,
      distanceKm,
      lagDays: Math.round(lagMillis / (24 * 60 * 60 * 1000)),
    });
  }

  candidates.sort((a, b) => {
    if (rankBy === "recent") {
      if (a.lagDays !== b.lagDays) {
        return a.lagDays - b.lagDays;
      }
      return a.distanceKm - b.distanceKm;
    }

    if (rankBy === "closest") {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return a.lagDays - b.lagDays;
    }

    // Balanced mode: prefer close observations while still valuing recency.
    const aScore = a.distanceKm + a.lagDays * 0.25;
    const bScore = b.distanceKm + b.lagDays * 0.25;
    if (aScore !== bScore) {
      return aScore - bScore;
    }

    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }

    return a.lagDays - b.lagDays;
  });

  const top = candidates.slice(0, maxResults);
  const best = top[0] || null;

  const summary = {
    sampleCount: top.length,
    avgTempC: average(top.map((r) => r.tempC)),
    avgSalinity: average(top.map((r) => r.salinity)),
    avgOxygenUmolKg: average(top.map((r) => r.oxygenUmolKg)),
    avgNitrate: average(top.map((r) => r.nitrateEst)),
    avgChlorophyll: average(top.map((r) => r.chlorophyllEst)),
    minDistanceKm: top.length ? Math.min(...top.map((r) => r.distanceKm)) : null,
    maxDistanceKm: top.length ? Math.max(...top.map((r) => r.distanceKm)) : null,
    minLagDays: top.length ? Math.min(...top.map((r) => r.lagDays)) : null,
    maxLagDays: top.length ? Math.max(...top.map((r) => r.lagDays)) : null,
  };

  return {
    query: {
      zipCode,
      targetDate: new Date(validTargetMillis).toISOString(),
      maxDistanceKm,
      windowDays,
      maxResults,
      rankBy,
    },
    geocode,
    summary,
    bestObservation: best
      ? {
          sourceFile: best.sourceFile,
          castId: best.castId,
          stationId: best.stationId,
          observedAtUtc: new Date(best.observedAtUtc).toISOString(),
          lat: best.lat,
          lon: best.lon,
          distanceKm: Number(best.distanceKm.toFixed(2)),
          lagDays: best.lagDays,
          depthM: best.depthM,
          tempC: best.tempC,
          salinity: best.salinity,
          oxygenUmolKg: best.oxygenUmolKg,
          nitrateEst: best.nitrateEst,
          chlorophyllEst: best.chlorophyllEst,
        }
      : null,
  };
}
