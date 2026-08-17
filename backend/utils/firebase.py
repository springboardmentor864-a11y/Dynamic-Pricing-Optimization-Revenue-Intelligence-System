import os
import logging
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("pricepilot")

# Setup Bearer token scheme
security_scheme = HTTPBearer(auto_error=False)

# Firebase admin is completely disabled
FIREBASE_ENABLED = False

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> dict:
    """
    Verifies the authorization token locally.
    Supports a mock token fallback prefix ('mock-token-') for local development testing.
    All Google/Firebase Authentication is removed.
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication credentials are required."
        )
        
    token = credentials.credentials
    
    # 1. Graceful Session/Mock Token Handler
    if token.startswith("mock-token-"):
        try:
            core = token[len("mock-token-"):]
            if "-email-" in core:
                parts = core.split("-email-")
                user_id = parts[0]
                email_and_ts = parts[1].rsplit("-", 1)
                email = email_and_ts[0]
            else:
                parts = core.rsplit("-", 1)
                user_id = parts[0] if parts else "usr-admin-001"
                email = "admin@pricepilot.ai" if "admin" in user_id else "guest@pricepilot.ai"
        except Exception:
            user_id = "usr-admin-001"
            email = "admin@pricepilot.ai"
            
        name = "Local Administrator" if email == "admin@pricepilot.ai" else "Guest Viewer"
        picture = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        
        try:
            from backend.utils.db import execute_query
            user_recs = execute_query("SELECT name, profile_image FROM users WHERE email = %s", (email,))
            if user_recs:
                name = user_recs[0].get("name") or name
                picture = user_recs[0].get("profile_image") or picture
        except Exception as e:
            logger.warning(f"Could not retrieve user profile from DB in verify_firebase_token: {str(e)}")

        return {
            "uid": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "is_mock": True
        }

    # Strict check: reject non-mock tokens since Firebase is removed
    raise HTTPException(
        status_code=401,
        detail="Token verification failed: Firebase/Google Authentication has been disabled."
    )

def verify_firebase_token_soft(credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> dict:
    """
    Optional token verifier that falls back to a default mock session if headers are completely missing.
    Prevents standard dashboard endpoints from breaking when called by frontend pages without headers.
    """
    if not credentials:
        logger.debug("Authorization header missing. Providing default sandbox session profile.")
        return {
            "uid": "usr-admin-001",
            "email": "admin@pricepilot.ai",
            "name": "Local Administrator",
            "picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "is_mock": True
        }
    return verify_firebase_token(credentials)

def require_roles(allowed_roles: list) -> dict:
    """
    FastAPI dependency factory to enforce Role-Based Access Control (RBAC).
    Verifies the user's ID token and asserts that their database role is in allowed_roles.
    """
    from fastapi import Depends
    
    def dependency(decoded_token: dict = Depends(verify_firebase_token)) -> dict:
        email = decoded_token.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token: missing email claim.")
            
        # Fetch role from local database
        from backend.utils.db import execute_query
        users = execute_query("SELECT id, role, status FROM users WHERE email = %s", (email,))
        if not users:
            raise HTTPException(status_code=401, detail="User account is not registered in PricePilot.")
            
        user = users[0]
        if user["status"] != "Active":
            raise HTTPException(status_code=403, detail="Forbidden: User account is suspended.")
            
        role = user["role"]
        if role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Access requires one of the following roles: {', '.join(allowed_roles)} (Your role: {role})."
            )
            
        return user
        
    return dependency
