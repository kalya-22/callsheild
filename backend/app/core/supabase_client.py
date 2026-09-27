from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from the backend directory
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_ENV_PATH)

DEFAULT_SUPABASE_URL = "https://vwhfjcpjyjkglionqpny.supabase.co"
DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3aGZqY3BqeWprZ2xpb25xcG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MDU5NjksImV4cCI6MjEwNTM4MTk2OX0.CXPtxsyoIRHGoNF8JuFJrob9k__jICFLddiU9hz2CIE"

SUPABASE_URL: str = os.environ.get("SUPABASE_URL") or DEFAULT_SUPABASE_URL
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY") or DEFAULT_SUPABASE_ANON_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
