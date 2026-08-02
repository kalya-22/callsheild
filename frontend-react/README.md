# CallShield Connected Mobile UI

This folder contains the imported mobile UI connected to the CallShield FastAPI backend.

## Connected Features

- Home dashboard checks backend, model, database, and prediction history.
- Upload test audio from the home screen and call `/api/v1/predict`.
- Live Call screen asks for microphone permission, creates 3-second WAV chunks, and calls `/api/v1/predict-chunk`.
- Live Analysis screen shows the latest real model result from live detection.
- History screen reads and clears saved predictions from SQLite through `/api/v1/history`.

## Run Backend

From the project root:

```powershell
cd C:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield
$env:PYTHONPATH = ".;backend;.venv\Lib\site-packages"
python scripts\run_api.py
```

Check:

```text
http://127.0.0.1:8000/
```

Expected:

```json
{"message":"CallShield API is running"}
```

## Run Frontend

In a second terminal:

```powershell
cd C:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield\frontend-react
npm install
npm run dev
```

Open the Vite URL, usually:

```text
http://127.0.0.1:5173
```

If your backend runs on another machine or port, copy `.env.example` to `.env` and change `VITE_CALLSHIELD_API_BASE_URL`.

To enable Google Sign-In:

- Create a **Web application** OAuth 2.0 client ID in Google Cloud Console.
- Set the authorized JavaScript origins to `http://localhost:5173` and `http://127.0.0.1:5173`.
- Add the client ID to `frontend-react/.env` as `VITE_GOOGLE_CLIENT_ID`.
