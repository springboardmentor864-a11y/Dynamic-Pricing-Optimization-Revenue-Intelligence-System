import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hashes a password using standard PBKDF2 HMAC-SHA256 with a unique salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """Verifies a password against a PBKDF2 hash, falling back to plain-text for legacy users."""
    if not hashed:
        return False
        
    if "$" not in hashed:
        # Fallback to plain text match for legacy admin/guest accounts
        return password == hashed
        
    try:
        salt, key_hex = hashed.split("$", 1)
        expected_key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return expected_key.hex() == key_hex
    except Exception:
        return False
