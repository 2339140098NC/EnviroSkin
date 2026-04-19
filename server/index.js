import express from "express";
import cors from "cors";
import { loadCalcofiData, queryCalcofiContext } from "./calcofiService.js";
import { queryNearbyUvPoints } from "./uvService.js";

const app = express();
const PORT = process.env.PORT || 8787;
const SUPPORTED_TRANSLATION_LANGUAGES = new Set([
  "es",
  "fr",
  "it",
  "ko",
  "zh",
  "ar",
  "sg",
  "so",
  "st",
  "pt",
]);

async function translateText(text, targetLanguage) {
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
      targetLanguage,
    )}&dt=t&q=${encodeURIComponent(text)}`,
  );

  if (!response.ok) {
    throw new Error(`Translation request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((part) => part?.[0] || "").join("")
    : "";

  if (!translated) {
    throw new Error("No translated text returned");
  }

  return translated;
}

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

app.get("/api/uv/points", async (req, res) => {
  const zipCode = String(req.query.zip || "").trim();

  if (!/^\d{5}$/.test(zipCode)) {
    return res.status(400).json({ error: "zip query param must be a 5-digit US ZIP code" });
  }

  try {
    const payload = await queryNearbyUvPoints({ zipCode });
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/translate", async (req, res) => {
  const target = String(req.query.target || "").trim().toLowerCase();
  const text = String(req.query.text || "").trim();

  if (!SUPPORTED_TRANSLATION_LANGUAGES.has(target)) {
    return res.status(400).json({ error: "Unsupported target language" });
  }

  if (!text) {
    return res.status(400).json({ error: "text query param is required" });
  }

  try {
    const translatedText = await translateText(text, target);
    return res.json({ translatedText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/translate/batch", async (req, res) => {
  const target = String(req.body?.target || "").trim().toLowerCase();
  const texts = Array.isArray(req.body?.texts)
    ? req.body.texts.filter((value) => typeof value === "string" && value.trim().length > 0)
    : [];

  if (!SUPPORTED_TRANSLATION_LANGUAGES.has(target)) {
    return res.status(400).json({ error: "Unsupported target language" });
  }

  if (texts.length === 0) {
    return res.status(400).json({ error: "texts must be a non-empty string array" });
  }

  try {
    const uniqueTexts = [...new Set(texts)];
    const translated = {};

    await Promise.all(
      uniqueTexts.map(async (text) => {
        translated[text] = await translateText(text, target);
      }),
    );

    return res.json({ translated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`CalCOFI backend listening on http://localhost:${PORT}`);
});
