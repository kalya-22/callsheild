from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from the backend directory
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_ENV_PATH)

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_ANON_KEY must be set in backend/.env"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
