# CallShield API Documentation

Base URL:

```text
http://127.0.0.1:8000/api/v1
```

Android emulator base URL:

```text
http://10.0.2.2:8000/api/v1
```

Physical phone on same Wi-Fi:

```text
http://YOUR_PC_IP:8000/api/v1
```

Example:

```text
http://192.168.1.5:8000/api/v1
```

The backend has CORS enabled for local web, Android emulator, and common LAN testing addresses.

## Health Check

```text
GET /health
```

Purpose: Confirms the backend server is running.

Example response:

```json
{
  "status": "healthy"
}
```

## Backend Status

```text
GET /status
```

Purpose: Shows whether the model, database, and feature files are available.

Example response:

```json
{
  "service": "CallShield API",
  "status": "ready",
  "model_ready": true,
  "database_ready": true,
  "features_ready": true,
  "prediction_count": 3,
  "model_path": "ml/models/baseline_model.joblib",
  "database_path": "database/callshield.db"
}
```

## Predict Audio

```text
POST /predict
```

Purpose: Uploads an audio file and predicts whether the voice is human or AI-generated.

Allowed formats:

```text
.wav, .flac, .mp3, .m4a, .ogg
```

Example response:

```json
{
  "prediction_id": 1,
  "filename": "sample.mp3",
  "predicted_label": "ai_generated",
  "ai_probability": 0.9988,
  "risk_level": "high",
  "warning": true,
  "chunk_count": 3,
  "created_at": "2026-07-20T18:07:58.474218+00:00",
  "chunk_predictions": []
}
```

## Prediction History

```text
GET /history
```

Purpose: Returns recent saved prediction results.

Optional query parameter:

```text
limit=20
```

## Prediction History Detail

```text
GET /history/{prediction_id}
```

Purpose: Returns one saved prediction with chunk-wise prediction details.

## Delete One History Item

```text
DELETE /history/{prediction_id}
```

Purpose: Deletes one saved prediction record.

## Clear All History

```text
DELETE /history
```

Purpose: Clears prediction history, useful before demos and testing.
