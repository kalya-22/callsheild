CREATE TABLE IF NOT EXISTS prediction_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    predicted_label TEXT NOT NULL,
    ai_probability REAL NOT NULL,
    risk_level TEXT NOT NULL,
    warning INTEGER NOT NULL,
    chunk_count INTEGER NOT NULL,
    chunk_predictions_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

