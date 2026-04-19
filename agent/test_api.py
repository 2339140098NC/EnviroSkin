import os
from pathlib import Path

from google import genai
from PIL import Image

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

AGENT_DIR = Path(__file__).parent
SYSTEM_PROMPT = (AGENT_DIR / "system_prompt.md").read_text()

image = Image.open(AGENT_DIR / "images.jpg")

fake_context = """
CNN SCORES:
- UV Damage / Sunburn: 3%
- Heat Rash: 21%
- Concerning Lesion: 68%
- Other: 8%

USER HISTORY:
- Was at the beach yesterday afternoon for 4+ hours
- Did not swim
- First noticed this today

ENVIRONMENTAL CONTEXT:
- UV Index: 9 (Very High)
- Heat Index: 98°F, Humidity: 61%
- AQI: 42 (Good)
- Ocean conditions: Normal
- Community reports: 8 similar cases this week in this zip
"""

response = client.models.generate_content(
    model="gemini-2.5-flash",
    config={"system_instruction": SYSTEM_PROMPT},
    contents=[image, fake_context]
)

print(response.text)