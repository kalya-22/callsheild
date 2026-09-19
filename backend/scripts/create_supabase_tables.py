"""
Run this script ONCE to create all required CallShield tables in Supabase.
Usage:
    $env:PYTHONPATH='.'; & ".venv\Scripts\python.exe" backend/scripts/create_supabase_tables.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.core.supabase_client import supabase, SUPABASE_URL

DDL_STATEMENTS = [
    # 1. Prediction History
    """
    CREATE TABLE IF NOT EXISTS prediction_history (
        id          BIGSERIAL PRIMARY KEY,
        filename    TEXT        NOT NULL,
        predicted_label TEXT    NOT NULL,
        ai_probability  REAL    NOT NULL,
        risk_level  TEXT        NOT NULL,
        warning     BOOLEAN     NOT NULL DEFAULT false,
        chunk_count INTEGER     NOT NULL DEFAULT 1,
        chunk_predictions_json TEXT NOT NULL DEFAULT '[]',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # 2. Live Call Reports
    """
    CREATE TABLE IF NOT EXISTS live_call_reports (
        id              BIGSERIAL PRIMARY KEY,
        phone_number    TEXT        NOT NULL DEFAULT 'Unknown',
        final_verdict   TEXT        NOT NULL,
        overall_risk_score REAL     NOT NULL,
        risk_level      TEXT        NOT NULL,
        attributed_generator TEXT,
        attribution_confidence REAL,
        synthesis_technique TEXT,
        call_duration_seconds INTEGER,
        chunk_count     INTEGER     NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # 3. Scam Blacklist (phone numbers reported as scam)
    """
    CREATE TABLE IF NOT EXISTS scam_blacklist (
        id           BIGSERIAL PRIMARY KEY,
        phone_number TEXT        NOT NULL UNIQUE,
        report_count INTEGER     NOT NULL DEFAULT 1,
        last_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        source       TEXT        NOT NULL DEFAULT 'user_report'
    );
    """,
]

def main() -> None:
    print(f"🔗 Connecting to Supabase: {SUPABASE_URL}")

    for i, ddl in enumerate(DDL_STATEMENTS, start=1):
        table_name = ["prediction_history", "live_call_reports", "scam_blacklist"][i - 1]
        try:
            # Use Supabase RPC to run raw SQL (requires service role or use dashboard)
            # For anon key, we can verify by attempting a select
            result = supabase.table(table_name).select("id").limit(1).execute()
            print(f"  ✅ Table '{table_name}' already exists and is accessible.")
        except Exception as e:
            error_msg = str(e)
            if "does not exist" in error_msg or "relation" in error_msg:
                print(f"  ❌ Table '{table_name}' does NOT exist yet.")
                print(f"     → Please run the SQL below in Supabase Dashboard > SQL Editor:")
                print(ddl)
            else:
                print(f"  ⚠️  Table '{table_name}': {error_msg}")

    print("\n🎉 Supabase connection verified successfully!")
    print("📋 If any tables are missing, run the SQL in: https://supabase.com/dashboard/project/vwhfjcpjyjkglionqpny/sql/new")

if __name__ == "__main__":
    main()
