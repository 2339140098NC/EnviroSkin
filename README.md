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

## API services

This app uses two backends:

- `server/index.js` on port `8787` for CalCOFI and translation endpoints
- `agent/server.py` on port `8000` for `/api/analyze`

In local development, Vite proxies `/api/analyze` to `http://localhost:8000` and other `/api/*` routes to `http://localhost:8787`.

If production routing differs from the defaults, set:

```bash
VITE_API_BASE_URL=https://your-express-api.example.com
VITE_ANALYZE_API_BASE_URL=https://your-fastapi-api.example.com
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
