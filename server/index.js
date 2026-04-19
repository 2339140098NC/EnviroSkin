import express from "express";
import cors from "cors";
import { loadCalcofiData, queryCalcofiContext } from "./calcofiService.js";

const app = express();
const PORT = process.env.PORT || 8787;

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parsePositiveNumber(value, fallback) {
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n"].includes(normalized)) {
    return false;
  }

  return fallback;
}

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const rows = await loadCalcofiData();
    res.json({ ok: true, loadedRows: rows.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/calcofi/context", async (req, res) => {
  const zipCode = String(req.query.zip || "").trim();
  const targetDate = String(req.query.date || "").trim() || undefined;
  const rankByRaw = String(req.query.rankBy || "balanced").trim().toLowerCase();
  const rankBy = ["balanced", "closest", "recent"].includes(rankByRaw) ? rankByRaw : "balanced";
  const includeObservations = parseBoolean(req.query.includeObservations, false);
  const observationsLimit = parsePositiveInt(req.query.observationsLimit, 3);
  const maxResults = parsePositiveInt(req.query.maxResults, 100);
  const windowDays = parsePositiveInt(req.query.windowDays, 180);
  const maxDistanceKm = parsePositiveNumber(req.query.maxDistanceKm, 300);

  if (!/^\d{5}$/.test(zipCode)) {
    return res.status(400).json({ error: "zip query param must be a 5-digit US ZIP code" });
  }

  try {
    const context = await queryCalcofiContext({
      zipCode,
      targetDate,
      rankBy,
      includeObservations,
      observationsLimit,
      maxResults,
      windowDays,
      maxDistanceKm,
    });

    console.log("CalCOFI context result:\n", JSON.stringify(context, null, 2));
    return res.json(context);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`CalCOFI backend listening on http://localhost:${PORT}`);
});
