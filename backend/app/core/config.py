from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "CallShield"
    model_path: str = "ml/models/baseline_model.joblib"
    database_url: str = "sqlite:///database/callshield.db"
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
