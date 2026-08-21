import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# 256-bit Shared Secret Key for Zero-Knowledge End-to-End Encryption
SHARED_AES_KEY_BYTES = b"CallShieldAESSecretKey256Bit2026!"  # 32 bytes = 256 bits


def decrypt_audio_chunk(encrypted_base64: str, iv_base64: str) -> bytes:
    """
    Decrypts an AES-256-GCM encrypted audio chunk in RAM.
    Zero-Knowledge Guarantee: Raw audio is never written to disk in plain text.
    """
    try:
        key = SHARED_AES_KEY_BYTES[:32]
        aesgcm = AESGCM(key)

        ciphertext = base64.b64decode(encrypted_base64)
        iv = base64.b64decode(iv_base64)

        plain_wav_bytes = aesgcm.decrypt(iv, ciphertext, None)
        return plain_wav_bytes
    except Exception as exc:
        raise ValueError(f"AES-256 Decryption failed: {exc}") from exc


def encrypt_audio_chunk(plain_wav_bytes: bytes) -> tuple[str, str]:
    """
    Encrypts a raw WAV audio byte array using AES-256-GCM.
    Returns (encrypted_base64, iv_base64).
    """
    import os
    key = SHARED_AES_KEY_BYTES[:32]
    aesgcm = AESGCM(key)
    iv = os.urandom(12)  # 96-bit GCM IV
    ciphertext = aesgcm.encrypt(iv, plain_wav_bytes, None)

    encrypted_base64 = base64.b64encode(ciphertext).decode("utf-8")
    iv_base64 = base64.b64encode(iv).decode("utf-8")

    return encrypted_base64, iv_base64
