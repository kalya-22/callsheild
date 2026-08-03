from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
import base64
import tempfile
from pathlib import Path
from starlette.concurrency import run_in_threadpool
from ml.src.inference.predict_audio import predict_live_audio_chunk


from app.schemas.prediction import (
    AuthResponse,
    BackendStatus,
    GoogleLoginRequest,
    LoginRequest,
    SignupRequest,
    DeleteResponse,
    LiveChunkResponse,
    PredictionHistoryDetail,
    PredictionHistoryItem,
    PredictionResponse,
)
from app.services.auth_service import authenticate_google_user, authenticate_user, create_user
from app.services.history_service import (
    clear_predictions,
    delete_prediction,
    get_prediction,
    list_predictions,
)
from app.services.prediction_service import predict_uploaded_audio, predict_uploaded_chunk
from app.services.status_service import get_backend_status

router = APIRouter()


@router.post("/auth/signup", response_model=AuthResponse, status_code=201)
def signup(request: SignupRequest) -> dict[str, object]:
    try:
        return create_user(request.full_name, request.email, request.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/auth/login", response_model=AuthResponse)
def login(request: LoginRequest) -> dict[str, object]:
    auth_result = authenticate_user(request.email, request.password)
    if auth_result is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return auth_result


@router.post("/auth/google", response_model=AuthResponse)
def google_login(request: GoogleLoginRequest) -> dict[str, object]:
    try:
        return authenticate_google_user(request.id_token, request.client_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}


@router.get("/status", response_model=BackendStatus)
def backend_status() -> dict[str, object]:
    return get_backend_status()


@router.post("/predict", response_model=PredictionResponse)
async def predict_audio(file: UploadFile = File(...)) -> dict[str, object]:
    try:
        return await predict_uploaded_audio(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Prediction failed") from exc


@router.post("/predict-chunk", response_model=LiveChunkResponse)
async def predict_audio_chunk(file: UploadFile = File(...)) -> dict[str, object]:
    try:
        return await predict_uploaded_chunk(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Chunk prediction failed") from exc


@router.get("/history", response_model=list[PredictionHistoryItem])
def prediction_history(limit: int = 20) -> list[dict[str, object]]:
    return list_predictions(limit=limit)


@router.get("/history/{prediction_id}", response_model=PredictionHistoryDetail)
def prediction_history_detail(prediction_id: int) -> dict[str, object]:
    prediction = get_prediction(prediction_id)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction


@router.delete("/history/{prediction_id}", response_model=DeleteResponse)
def delete_prediction_history(prediction_id: int) -> dict[str, object]:
    deleted = delete_prediction(prediction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {
        "message": "Prediction history item deleted",
        "deleted_count": 1,
    }


@router.delete("/history", response_model=DeleteResponse)
def clear_prediction_history() -> dict[str, object]:
    deleted_count = clear_predictions()
    return {
        "message": "Prediction history cleared",
        "deleted_count": deleted_count,
    }


@router.websocket("/ws/live-stream")
async def live_audio_websocket(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            audio_base64 = data.get("audio_base64")
            filename = data.get("filename", "live_stream_chunk.wav")

            if not audio_base64:
                await websocket.send_json({"error": "Missing audio_base64 data"})
                continue

            raw_bytes = base64.b64decode(audio_base64)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_path = Path(temp_file.name)
                temp_file.write(raw_bytes)

            try:
                result = await run_in_threadpool(
                    predict_live_audio_chunk,
                    temp_path,
                    filename,
                )
                await websocket.send_json({
                    "status": "success",
                    "result": result,
                })
            finally:
                temp_path.unlink(missing_ok=True)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"error": str(exc)})
        except Exception:
            pass

