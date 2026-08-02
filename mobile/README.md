# Mobile

Flutter frontend for CallShield is located in `mobile/callshield_app/`.

## Current Features

- Backend status check
- Audio file picker
- Upload audio to FastAPI `/predict`
- Display AI probability, risk level, warning status, and chunk-wise predictions

## Run

Install Flutter, start the FastAPI backend, then run:

```powershell
cd mobile\callshield_app
flutter pub get
flutter run
```
