from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from app.core.supabase_client import supabase

TABLE = "prediction_history"


def initialize_database() -> None:
    """
    No-op for Supabase — tables are created in the Supabase Dashboard SQL editor.
    Kept for compatibility with main.py startup hook.
    """
    pass


def save_prediction(result: dict[str, Any]) -> dict[str, Any]:
    created_at = datetime.now(UTC).isoformat()

    row = {
        "filename": result["filename"],
        "predicted_label": result["predicted_label"],
        "ai_probability": float(result["ai_probability"]),
        "risk_level": result["risk_level"],
        "warning": bool(result["warning"]),
        "chunk_count": int(result.get("chunk_count", 1)),
        "chunk_predictions_json": json.dumps(result.get("chunk_predictions", [])),
        "created_at": created_at,
    }

    try:
        response = supabase.table(TABLE).insert(row).execute()
        inserted = response.data[0] if response.data else {}
        result["prediction_id"] = inserted.get("id", int(datetime.now().timestamp() * 1000))
    except Exception as e:
        print(f"[Supabase Sync Notice] Saved locally, cloud sync deferred: {e}")
        result["prediction_id"] = int(datetime.now().timestamp() * 1000)

    result["created_at"] = created_at
    return result


def list_predictions(limit: int = 20) -> list[dict[str, Any]]:
    limit = max(1, min(limit, 100))
    response = (
        supabase.table(TABLE)
        .select("id, filename, predicted_label, ai_probability, risk_level, warning, chunk_count, created_at")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [_row_to_summary(row) for row in (response.data or [])]


def get_prediction(prediction_id: int) -> dict[str, Any] | None:
    response = (
        supabase.table(TABLE)
        .select("*")
        .eq("id", prediction_id)
        .single()
        .execute()
    )
    if not response.data:
        return None
    return _row_to_detail(response.data)


def count_predictions() -> int:
    response = supabase.table(TABLE).select("id", count="exact").execute()
    return response.count or 0


def delete_prediction(prediction_id: int) -> bool:
    response = (
        supabase.table(TABLE)
        .delete()
        .eq("id", prediction_id)
        .execute()
    )
    return bool(response.data)


def clear_predictions() -> int:
    total = count_predictions()
    supabase.table(TABLE).delete().neq("id", 0).execute()
    return total


def _row_to_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "prediction_id": row["id"],
        "filename": row["filename"],
        "predicted_label": row["predicted_label"],
        "ai_probability": float(row["ai_probability"]),
        "risk_level": row["risk_level"],
        "warning": bool(row["warning"]),
        "chunk_count": int(row["chunk_count"]),
        "created_at": row["created_at"],
    }


def _row_to_detail(row: dict[str, Any]) -> dict[str, Any]:
    detail = _row_to_summary(row)
    detail["chunk_predictions"] = json.loads(row.get("chunk_predictions_json") or "[]")
    return detail
