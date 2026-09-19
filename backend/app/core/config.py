import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env from backend directory
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseModel):
    app_name: str = "CallShield"
    model_path: str = "ml/models/baseline_model.joblib"
    supabase_url: str = os.environ.get("SUPABASE_URL", "")
    supabase_anon_key: str = os.environ.get("SUPABASE_ANON_KEY", "")
    cors_allowed_origins: list[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://10.0.2.2",
        "http://10.0.2.2:8000",
        "*"
    ]


settings = Settings()
