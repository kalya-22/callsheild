# CallShield Expo App

This Expo app opens the existing CallShield React frontend inside a native WebView, so the mobile app keeps the same UI, screens, backend integration, upload flow, live monitoring dashboard, alert page, and safe result page as the web prototype.

## Run Backend

From the main project folder:

```powershell
cd C:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield
.\.venv\Scripts\activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

## Run Web Frontend

From the web frontend folder:

```powershell
cd C:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield\frontend-react
npm run dev -- --host 0.0.0.0 --port 5174
```

## Run Expo App

From this folder:

```powershell
cd C:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield\CallShieldExpo
npm install
npm start
```

Scan the QR code using Expo Go.

If the app cannot reach the web frontend, enter your laptop Wi-Fi IPv4 address in the app, for example:

```text
192.168.1.10
```

The app will open:

```text
http://192.168.1.10:5174
```

## Fix Expo Go "Something went wrong"

If Expo Go opens a blue "Something went wrong" screen immediately after scanning, reinstall the mobile dependencies and clear Metro cache:

```powershell
cd C:\Users\kalya\Documents\Codex\2026-07-03\su\CallShield\CallShieldExpo
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
npx expo start -c
```

This project targets Expo SDK 54, React Native 0.81, and React 19.1 for current Expo Go compatibility.

## Important

Use `--host 0.0.0.0` for both backend and frontend access from a real phone. `localhost` and `127.0.0.1` on a phone point to the phone itself, not the laptop.
