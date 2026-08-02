from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from ml.src.inference.predict_audio import predict_audio_file, predict_live_audio_chunk

from app.services.history_service import save_prediction


ALLOWED_EXTENSIONS = {".wav", ".flac", ".mp3", ".m4a", ".ogg"}


def validate_audio_file(filename: str) -> None:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(f"Unsupported audio format. Allowed formats: {allowed}")


async def predict_uploaded_audio(file: UploadFile) -> dict[str, object]:
    validate_audio_file(file.filename or "")

    suffix = Path(file.filename or "uploaded_audio.wav").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = Path(temp_file.name)
        temp_file.write(await file.read())

    try:
        result = await run_in_threadpool(predict_audio_file, temp_path)
        result["filename"] = file.filename or temp_path.name
        result.pop("audio_path", None)
        return save_prediction(result)
    except ValueError as exc:
        raise ValueError(str(exc)) from exc
    finally:
        temp_path.unlink(missing_ok=True)


async def predict_uploaded_chunk(file: UploadFile) -> dict[str, object]:
    validate_audio_file(file.filename or "")

    suffix = Path(file.filename or "live_chunk.wav").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = Path(temp_file.name)
        temp_file.write(await file.read())

    try:
        return await run_in_threadpool(
            predict_live_audio_chunk,
            temp_path,
            file.filename or temp_path.name,
        )
    finally:
        temp_path.unlink(missing_ok=True)
