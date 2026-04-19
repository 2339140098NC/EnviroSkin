import io
import json
import os
import sys
import time
import traceback
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from PIL import Image

AGENT_DIR = Path(__file__).parent
REPO_ROOT = AGENT_DIR.parent
sys.path.insert(0, str(AGENT_DIR))
sys.path.insert(0, str(REPO_ROOT))

load_dotenv(REPO_ROOT / ".env")

from env.context_builder import build_context
from env.fetchers import epa_aqi, noaa_uv
from skin_classify import classify

SYSTEM_PROMPT = (AGENT_DIR / "system_prompt.md").read_text()
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

ALLOWED_TRIAGE_LEVELS = {"green", "yellow", "red"}
ALLOWED_ENV_FACTORS = {
    "high_uv",
    "long_sun_exposure",
    "high_heat",
    "high_humidity",
    "poor_air_quality",
    "ocean_exposure",
    "plant_exposure",
    "local_case_cluster",
}
DRIVER_KEYS = [
    "uv_exposure",
    "air_quality",
    "heat_and_humidity",
    "water_conditions",
    "plant_exposure",
]
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
MODEL_RETRY_ATTEMPTS = 3
MODEL_RETRY_DELAYS_SECONDS = [1.0, 2.0]


def _clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def _to_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_list(value, fallback, min_items=1, max_items=5):
    if not isinstance(value, list):
        return fallback

    cleaned = []
    seen = set()
    for item in value:
        text = str(item).strip()
        if not text:
            continue
        normalized_key = text.lower()
        if normalized_key in seen:
            continue
        seen.add(normalized_key)
        cleaned.append(text)
        if len(cleaned) >= max_items:
            break

    if len(cleaned) < min_items:
        return fallback
    return cleaned


def _normalize_driver_entry(raw_entry):
    if not isinstance(raw_entry, dict):
        return {
            "value": "Not available",
            "explanation": "Local data unavailable for this location.",
        }

    value = str(raw_entry.get("value", "")).strip() or "Not available"
    explanation = (
        str(raw_entry.get("explanation", "")).strip()
        or "Local data unavailable for this location."
    )
    return {
        "value": value,
        "explanation": explanation,
    }


def _normalize_analysis(payload: dict, environmental_context: dict | None = None) -> dict:
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="Model output is not a JSON object")

    triage_level = str(payload.get("triage_level", "yellow")).strip().lower()
    if triage_level not in ALLOWED_TRIAGE_LEVELS:
        triage_level = "yellow"

    confidence = _to_float(payload.get("confidence"), 0.5)
    confidence = round(_clamp(confidence, 0.0, 1.0), 2)

    condition_name = str(payload.get("condition_name", "Unspecified skin concern")).strip()
    if not condition_name:
        condition_name = "Unspecified skin concern"

    explanation = str(payload.get("explanation", "")).strip()
    if not explanation:
        explanation = "The image and context suggest a possible skin irritation pattern, but a clinician should confirm."

    why_flagged = _normalize_list(
        payload.get("why_flagged"),
        ["Visible skin changes and history suggest a possible irritation pattern."],
        min_items=1,
        max_items=5,
    )
    causes = _normalize_list(payload.get("causes"), ["Environmental irritation"], min_items=1, max_items=4)
    symptoms = _normalize_list(payload.get("symptoms"), ["Skin irritation"], min_items=1, max_items=4)
    treatments = _normalize_list(payload.get("treatments"), ["Seek clinician guidance"], min_items=1, max_items=4)
    risks = _normalize_list(payload.get("risks"), ["Ongoing exposure"], min_items=1, max_items=4)
    next_steps = _normalize_list(payload.get("next_steps"), ["Monitor symptoms and seek care if worsening."], min_items=1, max_items=5)

    raw_factors = payload.get("environmental_factors")
    if isinstance(raw_factors, list):
        environmental_factors = []
        for item in raw_factors:
            tag = str(item).strip()
            if tag in ALLOWED_ENV_FACTORS and tag not in environmental_factors:
                environmental_factors.append(tag)
    else:
        environmental_factors = []

    drivers = payload.get("environmental_drivers") if isinstance(payload.get("environmental_drivers"), dict) else {}
    environmental_drivers = {
        key: _normalize_driver_entry(drivers.get(key)) for key in DRIVER_KEYS
    }

    voice = str(payload.get("voice_narration_text", "")).strip()
    if not voice:
        voice = explanation

    return {
        "triage_level": triage_level,
        "condition_name": condition_name,
        "confidence": confidence,
        "explanation": explanation,
        "why_flagged": why_flagged,
        "causes": causes,
        "symptoms": symptoms,
        "treatments": treatments,
        "risks": risks,
        "environmental_drivers": environmental_drivers,
        "environmental_factors": environmental_factors,
        "next_steps": next_steps,
        "voice_narration_text": voice,
        "environmental_context": environmental_context or {},
    }


def _extract_upstream_error(exc: Exception) -> tuple[int, str]:
    message = str(exc).strip() or type(exc).__name__
    normalized = message.upper()

    if "503" in normalized or "UNAVAILABLE" in normalized or "HIGH DEMAND" in normalized:
        return (
            503,
            "The analysis model is temporarily overloaded. Please try again in a moment.",
        )

    if "429" in normalized or "RESOURCE_EXHAUSTED" in normalized or "RATE LIMIT" in normalized:
        return (
            429,
            "The analysis service is rate-limited right now. Please try again shortly.",
        )

    if "401" in normalized or "403" in normalized or "API KEY" in normalized:
        return (
            502,
            "The analysis service could not authenticate with the upstream model provider.",
        )

    return (502, f"Upstream model request failed: {message}")


def _generate_analysis(pil: Image.Image, context: str):
    last_error = None

    for attempt in range(MODEL_RETRY_ATTEMPTS):
        try:
            return client.models.generate_content(
                model=MODEL_NAME,
                config={"system_instruction": SYSTEM_PROMPT},
                contents=[pil, context],
            )
        except Exception as exc:
            last_error = exc
            status_code, _detail = _extract_upstream_error(exc)
            should_retry = status_code in {429, 503} and attempt < MODEL_RETRY_ATTEMPTS - 1

            if not should_retry:
                raise

            delay_seconds = MODEL_RETRY_DELAYS_SECONDS[min(attempt, len(MODEL_RETRY_DELAYS_SECONDS) - 1)]
            time.sleep(delay_seconds)

    raise last_error

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(form_data: str = Form(...), image: UploadFile = File(...)):
    try:
        form = json.loads(form_data)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"form_data is not valid JSON: {exc}")

    raw = await image.read()
    try:
        pil = Image.open(io.BytesIO(raw))
        pil.load()
        if pil.mode != "RGB":
            pil = pil.convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"could not read image: {exc}")

    try:
        scores = classify(pil, top_k=4)
        context = build_context(form, scores)
        environmental_context = {
            "noaa_uv": noaa_uv.fetch(form.get("zipCode", "")),
            "epa_aqi": epa_aqi.fetch(form.get("zipCode", "")),
        }
        response = _generate_analysis(pil, context)
    except Exception as exc:
        traceback.print_exc()
        status_code, detail = _extract_upstream_error(exc)
        raise HTTPException(status_code=status_code, detail=detail)

    text = (response.text or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        parsed = json.loads(text)
        return _normalize_analysis(parsed, environmental_context=environmental_context)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail={"raw": response.text})
