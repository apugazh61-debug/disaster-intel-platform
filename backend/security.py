"""
security.py
Enterprise Security Hardening for the Disaster Intelligence Platform.
Provides:
- Bcrypt password hashing & verification
- JWT token generation & role-based validation
- HMAC-SHA256 Anti-Tamper Audit Logging
- Sliding-Window Rate Limiting against DDoS & Brute Force
"""

import os
import time
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List
import bcrypt
import jwt
from fastapi import HTTPException, Security, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Cryptographic Keys (can be overridden via environment variables)
JWT_SECRET_KEY = os.getenv("ECO_SHIELD_JWT_SECRET", "eco-shield-statewide-defense-key-2026-unhackable-secret")
HMAC_AUDIT_KEY = os.getenv("ECO_SHIELD_HMAC_KEY", "eco-shield-audit-ledger-tamper-proof-hmac-key-2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12

security_bearer = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Password Management (Bcrypt)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a password using bcrypt with automated salt generation."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT Token Management
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT token with claims and expiry."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "iss": "eco-shield-auth-authority"
    })
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM], issuer="eco-shield-auth-authority")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)) -> dict:
    """Dependency that verifies the bearer token and returns the user payload."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_access_token(credentials.credentials)


def require_role(allowed_roles: List[str]):
    """Decorator / dependency to enforce role-based access control."""
    def role_checker(current_user: dict = Security(get_current_user)):
        user_role = current_user.get("role", "CITIZEN")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of {allowed_roles} roles. Your role is '{user_role}'.",
            )
        return current_user
    return role_checker


# ---------------------------------------------------------------------------
# Cryptographic HMAC-SHA256 Anti-Tamper Audit Ledger
# ---------------------------------------------------------------------------

def sign_audit_event(action: str, payload_str: str, timestamp: str) -> str:
    """Compute an immutable HMAC-SHA256 signature for an audit ledger event."""
    message = f"{action}:{payload_str}:{timestamp}".encode("utf-8")
    return hmac.new(HMAC_AUDIT_KEY.encode("utf-8"), message, hashlib.sha256).hexdigest()


def verify_audit_signature(action: str, payload_str: str, timestamp: str, signature: str) -> bool:
    """Verify that an audit ledger event has not been tampered with in storage."""
    expected_sig = sign_audit_event(action, payload_str, timestamp)
    return hmac.compare_digest(expected_sig, signature)


# ---------------------------------------------------------------------------
# Sliding-Window Rate Limiter (Anti-DDoS & Brute Force Shield)
# ---------------------------------------------------------------------------

class SlidingWindowRateLimiter:
    """In-memory rate limiter per IP address using a sliding window."""
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.history: Dict[str, List[float]] = {}

    def check(self, key: str):
        now = time.time()
        timestamps = self.history.get(key, [])
        # Filter out timestamps outside current sliding window
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        
        if len(valid_timestamps) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - valid_timestamps[0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Security threshold exceeded. Rate limit active. Please retry in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        valid_timestamps.append(now)
        self.history[key] = valid_timestamps


# Dedicated Rate Limiters for sensitive endpoints
auth_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)   # 10 login attempts / min
sos_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=30)     # 5 SOS per 30s
general_rate_limiter = SlidingWindowRateLimiter(max_requests=120, window_seconds=60) # 120 req / min


def get_client_ip(request: Request) -> str:
    """Extract client IP, taking into account forwarding headers safely."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"
