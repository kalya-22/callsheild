# CallShield Web Frontend

Static browser frontend for demonstrating the CallShield working prototype.

## Start Backend

From the `CallShield` root:

```powershell
$env:PYTHONPATH = ".;backend;.venv\Lib\site-packages"
python scripts\run_api.py
```

## Open Frontend

Open this file in a browser:

```text
frontend/index.html
```

The frontend now includes a refreshed responsive layout and a light/dark theme toggle.

If browser CORS or file restrictions occur, serve it locally:

```powershell
cd frontend
python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```
## Demo Flow

1. Check backend/model/database status.
2. Select an audio file.
3. Click `Run detection`.
4. Show AI probability, risk level, warning, and chunk-wise analysis.
5. Show saved prediction history.
