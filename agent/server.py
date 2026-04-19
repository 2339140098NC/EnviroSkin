import io
import json
import os
import sys
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
from skin_classify import classify

SYSTEM_PROMPT = (AGENT_DIR / "system_prompt.md").read_text()
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config={"system_instruction": SYSTEM_PROMPT},
            contents=[pil, context],
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}")

    text = (response.text or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail={"raw": response.text})
