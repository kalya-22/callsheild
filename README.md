# CallShield

CallShield is a final year B.Tech Computer Engineering project for detecting AI-generated voices used in vishing attacks during phone calls or recorded audio.

## Project Goal

Detect synthetic or AI-generated speech in real time and warn users when a call or audio sample appears suspicious.

## Planned Stack

- Python for machine learning and audio processing
- Librosa for feature extraction
- Scikit-Learn for baseline model training
- FastAPI for backend inference APIs
- Flutter for the mobile application
- SQLite for local storage

## Current Status

- Human audio dataset collected from LibriSpeech
- Audio preprocessing completed
- Chunk formation completed
- Feature extraction completed

## Main Modules

- `ml/` contains dataset handling, feature extraction, model training, evaluation, and inference logic.
- `backend/` contains the FastAPI service used by the mobile app.
- `mobile/` contains the Flutter application.
- `database/` contains SQLite schema and local database assets.
- `docs/` contains project documentation, diagrams, and report material.
- `scripts/` contains automation scripts for repeatable tasks.
- `tests/` contains integration and end-to-end tests.

