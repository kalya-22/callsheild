import socket
import sys
from pathlib import Path

import uvicorn


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    local_ip = get_local_ip()
    print(f"\n=======================================================")
    print(f" CallShield FastAPI Backend Starting...")
    print(f" Local host URL: http://localhost:8000")
    print(f" Network URL (for Expo Go / Phone): http://{local_ip}:8000")
    print(f" API Base URL: http://{local_ip}:8000/api/v1")
    print(f"=======================================================\n")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        app_dir=str(PROJECT_ROOT / "backend"),
    )


