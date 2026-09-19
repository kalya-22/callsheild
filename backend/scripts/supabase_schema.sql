-- ============================================================
-- CallShield Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Project: https://vwhfjcpjyjkglionqpny.supabase.co
-- ============================================================

-- 1. Prediction History (audio file analysis results)
CREATE TABLE IF NOT EXISTS prediction_history (
    id                      BIGSERIAL PRIMARY KEY,
    filename                TEXT        NOT NULL,
    predicted_label         TEXT        NOT NULL,
    ai_probability          REAL        NOT NULL,
    risk_level              TEXT        NOT NULL,
    warning                 BOOLEAN     NOT NULL DEFAULT false,
    chunk_count             INTEGER     NOT NULL DEFAULT 1,
    chunk_predictions_json  TEXT        NOT NULL DEFAULT '[]',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Live Call Reports (real-time phone call analysis logs)
CREATE TABLE IF NOT EXISTS live_call_reports (
    id                      BIGSERIAL PRIMARY KEY,
    phone_number            TEXT        NOT NULL DEFAULT 'Unknown',
    final_verdict           TEXT        NOT NULL,
    overall_risk_score      REAL        NOT NULL,
    risk_level              TEXT        NOT NULL,
    attributed_generator    TEXT,
    attribution_confidence  REAL,
    synthesis_technique     TEXT,
    call_duration_seconds   INTEGER,
    chunk_count             INTEGER     NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Scam Blacklist (phone numbers reported as scam)
CREATE TABLE IF NOT EXISTS scam_blacklist (
    id                  BIGSERIAL PRIMARY KEY,
    phone_number        TEXT        NOT NULL UNIQUE,
    report_count        INTEGER     NOT NULL DEFAULT 1,
    last_reported_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    source              TEXT        NOT NULL DEFAULT 'user_report'
);

-- 4. Users (CallShield user accounts)
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       TEXT        NOT NULL,
    email           TEXT        NOT NULL UNIQUE,
    password_salt   TEXT        NOT NULL,
    password_hash   TEXT        NOT NULL,
    auth_token      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_call_reports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_blacklist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;

-- Allow public anon access for now (all read/write)
CREATE POLICY "Allow all" ON prediction_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON live_call_reports  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON scam_blacklist      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users               FOR ALL USING (true) WITH CHECK (true);

