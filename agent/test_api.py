import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from PIL import Image

AGENT_DIR = Path(__file__).parent
REPO_ROOT = AGENT_DIR.parent
sys.path.insert(0, str(AGENT_DIR))
sys.path.insert(0, str(REPO_ROOT))

load_dotenv(REPO_ROOT / ".env")

from env.context_builder import build_context
from skin_classify import classify

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = (AGENT_DIR / "system_prompt.md").read_text()

image_path = AGENT_DIR / "images.jpg"
image = Image.open(image_path)

form_data = json.loads((AGENT_DIR / "sample_intake.json").read_text())
cnn_scores = classify(image_path, top_k=5)
context = build_context(form_data, cnn_scores)

print("===== CONTEXT SENT TO GEMINI =====")
print(context)
print("===== GEMINI RESPONSE =====")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    config={"system_instruction": SYSTEM_PROMPT},
    contents=[image, context],
)

print(response.text)
