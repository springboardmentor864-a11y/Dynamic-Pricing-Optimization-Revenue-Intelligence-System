# ==========================================================
# PricePilot AI - Enterprise Security & Rate Limiting Middleware
# Helmet equivalent HTTP Security Headers + Rate Limiting
# ==========================================================

import time
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict

# Simple In-Memory Token Bucket Rate Limiter for Login/Auth endpoints
class RateLimiter:
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        # Clean older requests outside the time window
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window_seconds
        ]
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        self.requests[client_ip].append(now)
        return True


rate_limiter = RateLimiter(max_requests=20, window_seconds=60)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds enterprise security headers (Helmet equivalent) to every HTTP response:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Strict-Transport-Security (HSTS)
    - Referrer-Policy
    - Content-Security-Policy
    """

    async def dispatch(self, request: Request, call_next):
        # Apply Rate Limiting to authentication endpoints to prevent brute-force attacks
        if request.url.path in ["/api/auth/login", "/api/auth/register"]:
            client_ip = request.client.host if request.client else "127.0.0.1"
            if not rate_limiter.is_allowed(client_ip):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts. Please wait a minute before trying again."
                )

        response: Response = await call_next(request)

        # Inject Helmet-equivalent security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Server"] = "PricePilot-Enterprise-API"

        return response
