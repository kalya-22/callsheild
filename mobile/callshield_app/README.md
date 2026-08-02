# CallShield Flutter App

Flutter frontend for uploading audio to the CallShield FastAPI backend and showing AI-voice risk results.

## Run Backend First

From the `CallShield` root folder:

```powershell
$env:PYTHONPATH = ".;backend;.venv\Lib\site-packages"
python scripts\run_api.py
```

Backend docs:

```text
http://127.0.0.1:8000/docs
```

## Run Flutter App

Install Flutter first, then run from this folder:

```powershell
flutter pub get
flutter run
```

## Backend URL Notes

- Windows desktop/web Flutter: `http://127.0.0.1:8000/api/v1`
- Android emulator: `http://10.0.2.2:8000/api/v1`
- Physical phone: use your PC LAN IP, for example `http://192.168.1.5:8000/api/v1`

