# Enviro-Skin

Environment-aware skin triage web app. Upload a photo plus location/context, and a Gemini-backed agent returns a triage level, likely causes, and environment-informed guidance.

## Frontend development

Install dependencies:

```bash
npm install
```

Run the Vite app locally:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Run the frontend test suite:

```bash
npm test
```

## Local model download

Download the Hugging Face model into the repo once:

```bash
python download_model.py
```

Run inference offline from the saved local files:

```bash
python skin_classify.py --image SkinDisease/SkinDisease/test/Acne/157__ProtectWyJQcm90ZWN0Il0_FocusFillWzI5NCwyMjIsIngiLDFd.jpeg
```
