import sys
from pathlib import Path

# Add project root and backend folder to Python sys.path so 'ml' and 'app' packages resolve from anywhere
ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
for path_str in (str(ROOT_DIR), str(BACKEND_DIR)):
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import router as v1_router
from app.core.config import settings
from app.services.auth_service import initialize_auth_database
from app.services.history_service import initialize_database


app = FastAPI(
    title="CallShield API",
    description="AI-generated voice detection API for vishing attack prevention.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")


@app.on_event("startup")
def startup() -> None:
    initialize_database()
    initialize_auth_database()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "CallShield API is running"}
