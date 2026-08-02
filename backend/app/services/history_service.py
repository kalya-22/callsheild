from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATABASE_DIR = PROJECT_ROOT / "database"
DATABASE_PATH = DATABASE_DIR / "callshield.db"


def get_connection() -> sqlite3.Connection:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
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
            )
            """
        )
        connection.commit()


def save_prediction(result: dict[str, Any]) -> dict[str, Any]:
    initialize_database()
    created_at = datetime.now(UTC).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO prediction_history (
                filename,
                predicted_label,
                ai_probability,
                risk_level,
                warning,
                chunk_count,
                chunk_predictions_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result["filename"],
                result["predicted_label"],
                float(result["ai_probability"]),
                result["risk_level"],
                int(bool(result["warning"])),
                int(result["chunk_count"]),
                json.dumps(result["chunk_predictions"]),
                created_at,
            ),
        )
        connection.commit()
        prediction_id = int(cursor.lastrowid)

    result["prediction_id"] = prediction_id
    result["created_at"] = created_at
    return result


def list_predictions(limit: int = 20) -> list[dict[str, Any]]:
    initialize_database()
    limit = max(1, min(limit, 100))

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                filename,
                predicted_label,
                ai_probability,
                risk_level,
                warning,
                chunk_count,
                created_at
            FROM prediction_history
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [row_to_summary(row) for row in rows]


def get_prediction(prediction_id: int) -> dict[str, Any] | None:
    initialize_database()

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM prediction_history
            WHERE id = ?
            """,
            (prediction_id,),
        ).fetchone()

    if row is None:
        return None
    return row_to_detail(row)


def count_predictions() -> int:
    initialize_database()

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT COUNT(*) AS total
            FROM prediction_history
            """
        ).fetchone()

    return int(row["total"])


def delete_prediction(prediction_id: int) -> bool:
    initialize_database()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM prediction_history
            WHERE id = ?
            """,
            (prediction_id,),
        )
        connection.commit()

    return cursor.rowcount > 0


def clear_predictions() -> int:
    initialize_database()

    with get_connection() as connection:
        total = count_predictions()
        connection.execute("DELETE FROM prediction_history")
        connection.commit()

    return total


def row_to_summary(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "prediction_id": int(row["id"]),
        "filename": row["filename"],
        "predicted_label": row["predicted_label"],
        "ai_probability": float(row["ai_probability"]),
        "risk_level": row["risk_level"],
        "warning": bool(row["warning"]),
        "chunk_count": int(row["chunk_count"]),
        "created_at": row["created_at"],
    }


def row_to_detail(row: sqlite3.Row) -> dict[str, Any]:
    detail = row_to_summary(row)
    detail["chunk_predictions"] = json.loads(row["chunk_predictions_json"])
    return detail
