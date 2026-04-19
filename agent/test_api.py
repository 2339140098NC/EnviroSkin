import json
import os
import sys
from pathlib import Path

from google import genai
from PIL import Image

AGENT_DIR = Path(__file__).parent
sys.path.insert(0, str(AGENT_DIR))

from env.context_builder import build_context

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = (AGENT_DIR / "system_prompt.md").read_text()

image = Image.open(AGENT_DIR / "images.jpg")

form_data = json.loads((AGENT_DIR / "sample_intake.json").read_text())
cnn_scores = {
    "UV Damage / Sunburn": 0.03,
    "Heat Rash": 0.21,
    "Concerning Lesion": 0.68,
    "Other": 0.08,
}
context = build_context(form_data, cnn_scores)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    config={"system_instruction": SYSTEM_PROMPT},
    contents=[image, context],
)

print(response.text)
