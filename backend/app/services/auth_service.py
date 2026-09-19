from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.supabase_client import supabase

PBKDF2_ITERATIONS = 120_000
USERS_TABLE = "users"


def initialize_auth_database() -> None:
    """
    No-op for Supabase — users table is created via SQL in the Supabase Dashboard.
    Kept for compatibility with main.py startup hook.
    """
    pass


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _hash_password(password: str, salt_hex: str) -> str:
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return digest.hex()


def _public_user(row: dict[str, Any], token: str) -> dict[str, Any]:
    return {
        "token": token,
        "user": {
            "user_id": row["id"],
            "full_name": row["full_name"],
            "email": row["email"],
        },
    }


def create_user(full_name: str, email: str, password: str) -> dict[str, Any]:
    clean_name = full_name.strip()
    clean_email = _normalize_email(email)

    if not clean_name:
        raise ValueError("Full name is required")
    if "@" not in clean_email or "." not in clean_email:
        raise ValueError("Valid email address is required")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")

    # Check if email already exists
    existing = supabase.table(USERS_TABLE).select("id").eq("email", clean_email).execute()
    if existing.data:
        raise ValueError("An account with this email already exists")

    salt_hex = secrets.token_hex(16)
    password_hash = _hash_password(password, salt_hex)
    token = secrets.token_urlsafe(32)
    created_at = datetime.now(UTC).isoformat()

    response = supabase.table(USERS_TABLE).insert({
        "full_name": clean_name,
        "email": clean_email,
        "password_salt": salt_hex,
        "password_hash": password_hash,
        "auth_token": token,
        "created_at": created_at,
        "last_login_at": created_at,
    }).execute()

    if not response.data:
        raise ValueError("Could not create account")

    row = response.data[0]
    return _public_user(row, token)


def _create_google_user(full_name: str, email: str) -> dict[str, Any]:
    clean_name = full_name.strip() or email.split('@')[0]
    clean_email = _normalize_email(email)
    if not clean_email:
        raise ValueError("Google account did not include a valid email")

    token = secrets.token_urlsafe(32)
    created_at = datetime.now(UTC).isoformat()

    response = supabase.table(USERS_TABLE).insert({
        "full_name": clean_name,
        "email": clean_email,
        "password_salt": secrets.token_hex(16),
        "password_hash": secrets.token_hex(64),
        "auth_token": token,
        "created_at": created_at,
        "last_login_at": created_at,
    }).execute()

    if not response.data:
        raise ValueError("Could not create Google account")

    row = response.data[0]
    return _public_user(row, token)


def _validate_google_id_token(id_token: str, client_id: str | None = None) -> dict[str, Any]:
    if not id_token:
        raise ValueError("Missing Google ID token")

    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    request = Request(url, headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=10) as response:
            raw_body = response.read().decode('utf-8')
    except (HTTPError, URLError) as exc:
        raise ValueError("Invalid Google token") from exc

    token_info = json.loads(raw_body)
    if token_info.get('error_description') or token_info.get('error'):
        raise ValueError(token_info.get('error_description') or token_info.get('error'))

    if client_id and token_info.get('aud') != client_id:
        raise ValueError('Google token audience mismatch')

    if token_info.get('iss') not in ('accounts.google.com', 'https://accounts.google.com'):
        raise ValueError('Invalid Google token issuer')

    if str(token_info.get('email_verified')).lower() != 'true':
        raise ValueError('Google email address is not verified')

    if 'email' not in token_info:
        raise ValueError('Google token did not include an email')

    return token_info


def authenticate_google_user(id_token: str, client_id: str | None = None) -> dict[str, Any]:
    token_info = _validate_google_id_token(id_token, client_id)
    full_name = token_info.get('name') or token_info.get('email', '').split('@')[0]
    clean_email = _normalize_email(token_info['email'])

    existing = supabase.table(USERS_TABLE).select("*").eq("email", clean_email).execute()

    if not existing.data:
        return _create_google_user(full_name, clean_email)

    row = existing.data[0]
    token = secrets.token_urlsafe(32)
    supabase.table(USERS_TABLE).update({
        "auth_token": token,
        "last_login_at": datetime.now(UTC).isoformat(),
    }).eq("id", row["id"]).execute()

    return _public_user(row, token)


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    clean_email = _normalize_email(email)

    response = supabase.table(USERS_TABLE).select(
        "id, full_name, email, password_salt, password_hash"
    ).eq("email", clean_email).execute()

    if not response.data:
        return None

    row = response.data[0]
    candidate_hash = _hash_password(password, row["password_salt"])
    if not hmac.compare_digest(candidate_hash, row["password_hash"]):
        return None

    token = secrets.token_urlsafe(32)
    supabase.table(USERS_TABLE).update({
        "auth_token": token,
        "last_login_at": datetime.now(UTC).isoformat(),
    }).eq("id", row["id"]).execute()

    return _public_user(row, token)
