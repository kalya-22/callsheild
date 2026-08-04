from pydantic import BaseModel


class ChunkPrediction(BaseModel):
    chunk_id: str
    start_time_seconds: float
    end_time_seconds: float
    predicted_label: str
    raw_predicted_label: str | None = None
    ai_probability: float
    ai_confidence_percent: float | None = None
    risk_level: str | None = None
    warning: bool | None = None


class PredictionResponse(BaseModel):
    prediction_id: int | None = None
    filename: str
    predicted_label: str
    ai_probability: float
    ai_confidence_percent: float | None = None
    risk_level: str
    warning: bool
    chunk_count: int
    ai_chunk_count: int | None = None
    average_ai_confidence: float | None = None
    average_ai_confidence_percent: float | None = None
    overall_risk_score: float | None = None
    overall_risk_percent: float | None = None
    final_call_verdict: str | None = None
    created_at: str | None = None
    chunk_predictions: list[ChunkPrediction]


class LiveChunkResponse(BaseModel):
    chunk_id: str
    predicted_label: str
    ai_probability: float
    ai_confidence_percent: float
    risk_level: str
    warning: bool
    chunk_count: int
    current_chunk_risk: float
    current_chunk_risk_percent: float
    final_call_verdict: str


class ChunkJsonPayload(BaseModel):
    filename: str = "live_chunk.wav"
    audio_base64: str | None = None



class PredictionHistoryItem(BaseModel):
    prediction_id: int
    filename: str
    predicted_label: str
    ai_probability: float
    risk_level: str
    warning: bool
    chunk_count: int
    created_at: str


class PredictionHistoryDetail(PredictionHistoryItem):
    chunk_predictions: list[ChunkPrediction]


class BackendStatus(BaseModel):
    service: str
    status: str
    model_ready: bool
    database_ready: bool
    features_ready: bool
    prediction_count: int
    model_path: str
    database_path: str


class DeleteResponse(BaseModel):
    message: str
    deleted_count: int



class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str
    client_id: str | None = None


class AuthUser(BaseModel):
    user_id: int
    full_name: str
    email: str


class AuthResponse(BaseModel):
    token: str
    user: AuthUser
