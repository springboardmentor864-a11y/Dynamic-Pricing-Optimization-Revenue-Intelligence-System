from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.utils.db import execute_query
from backend.utils.security import verify_password
from backend.utils.firebase import verify_firebase_token
from backend.utils.logger import logger

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class FirebaseLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None
    photoURL: Optional[str] = None

@router.post("/login")
def login(payload: LoginRequest):
    """Authenticates users and records login history."""
    try:
        users = execute_query(
            "SELECT * FROM users WHERE email = %s",
            (payload.email,)
        )
        if not users:
            logger.warning(f"Failed login attempt: non-existent email {payload.email}")
            return {
                "success": False,
                "message": "Invalid email or password"
            }
            
        user = users[0]
        # Verify PBKDF2 hashed password or fallback to plain-text check
        if not verify_password(payload.password, user.get("password_hash") or user.get("password")):
            logger.warning(f"Failed login attempt: incorrect password for email {payload.email}")
            return {
                "success": False,
                "message": "Invalid email or password"
            }
            
        if user["status"] != "Active":
            logger.warning(f"Blocked login attempt: suspended user account {payload.email}")
            return {
                "success": False,
                "message": "User account is suspended"
            }
            
        # Update last login time
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        execute_query(
            "UPDATE users SET last_login = %s WHERE id = %s",
            (now_str, user["id"]),
            is_write=True
        )
        
        # Log activity
        execute_query(
            """
            INSERT INTO activity_logs (user_id, user_email, action, module, description, details, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (user["id"], payload.email, "User Login", "Auth", "Successful login from IP / web agent.", "Successful login from IP / web agent.", now_str),
            is_write=True
        )
        
        logger.info(f"Successful login for user email: {payload.email}")
        
        return {
            "success": True,
            "message": "Login successful",
            "token": f"mock-token-{user['id']}-{int(datetime.now().timestamp())}",
            "user": {
                "id": user["id"],
                "name": user["full_name"],
                "email": user["email"],
                "role": user["role"]
            }
        }
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return {
            "success": False,
            "message": f"Authentication error: {str(e)}"
        }

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "User"
    department: Optional[str] = "Operations"

@router.post("/register")
def register(payload: RegisterRequest):
    """Public user self-registration."""
    try:
        # Check if email is duplicate
        existing = execute_query("SELECT id FROM users WHERE email = %s", (payload.email,))
        if existing:
            return {"success": False, "message": "A user with this email address already exists."}
            
        import uuid
        from backend.utils.security import hash_password
        uid = f"usr-{str(uuid.uuid4())[:8]}"
        created = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        hashed_pwd = hash_password(payload.password)
        
        execute_query(
            """
            INSERT INTO users (
                id, name, email, password_hash, role, created_at,
                full_name, password, department, phone, created_date, status, profile_image
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                uid,
                payload.full_name,
                payload.email,
                hashed_pwd,
                payload.role,
                created,
                payload.full_name,
                hashed_pwd,
                payload.department,
                "+1-555-0100",
                created,
                "Active",
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
            ),
            is_write=True
        )
        logger.info(f"Self-registered user: ID {uid}, email {payload.email}")
        return {"success": True, "message": "Registration successful.", "user_id": uid}
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        return {"success": False, "message": f"Registration failed: {str(e)}"}

@router.post("/firebase-login")
def firebase_login(payload: FirebaseLoginRequest, decoded_token: dict = Depends(verify_firebase_token)):
    """Verifies Firebase token, performs auto-registration if missing, and syncs profiles."""
    try:
        import uuid
        
        # Security check: Ensure email in request body matches validated token email
        token_email = decoded_token.get("email")
        if not token_email:
            raise HTTPException(status_code=400, detail="Invalid token: missing email profile.")
        if token_email.lower() != payload.email.lower():
            raise HTTPException(status_code=403, detail="Forbidden: token email profile mismatch.")
            
        # 1. Query if user exists in local database
        users = execute_query("SELECT * FROM users WHERE email = %s", (payload.email,))
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if not users:
            # Auto User Creation
            user_id = f"usr-{str(uuid.uuid4())[:8]}"
            role = "Analyst" # Default Role (User or Analyst)
            dept = "Revenue Operations"
            
            # Generate dummy hashed password for DB integrity
            from backend.utils.security import hash_password
            ph_pwd = hash_password(str(uuid.uuid4()))
            
            execute_query(
                """
                INSERT INTO users (
                    id, name, email, password_hash, role, created_at,
                    full_name, password, department, phone, created_date, status, profile_image, login_provider
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    payload.name or payload.email.split("@")[0],
                    payload.email,
                    ph_pwd,
                    role,
                    now_str,
                    payload.name or payload.email.split("@")[0],
                    ph_pwd,
                    dept,
                    "+1-555-0100",
                    now_str,
                    "Active",
                    payload.photoURL or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                    "Google"
                ),
                is_write=True
            )
            logger.info(f"Auto-created user account for Firebase login: {payload.email} (ID: {user_id}, Role: {role})")
            user_obj = {
                "id": user_id,
                "full_name": payload.name or payload.email.split("@")[0],
                "email": payload.email,
                "role": role,
                "department": dept,
                "profile_image": payload.photoURL or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                "created_at": now_str,
                "last_login": now_str,
                "login_provider": "Google"
            }
        else:
            existing_user = users[0]
            user_id = existing_user["id"]
            role = existing_user["role"]
            dept = existing_user.get("department") or "Revenue Operations"
            
            # Sync last login and update profile image if supplied
            img = payload.photoURL or existing_user.get("profile_image") or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
            execute_query(
                "UPDATE users SET last_login = %s, profile_image = %s, login_provider = 'Google' WHERE id = %s",
                (now_str, img, user_id),
                is_write=True
            )
            user_obj = {
                "id": user_id,
                "full_name": existing_user.get("full_name") or existing_user.get("name"),
                "email": existing_user["email"],
                "role": role,
                "department": dept,
                "profile_image": img,
                "created_at": existing_user.get("created_at") or existing_user.get("created_date"),
                "last_login": now_str,
                "login_provider": "Google"
            }
            
        # Log activity
        execute_query(
            """
            INSERT INTO activity_logs (user_id, user_email, action, module, description, details, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, payload.email, "Firebase User Login", "Auth", "Successful login via Firebase Auth SSO.", "Successful login via Firebase Auth SSO.", now_str),
            is_write=True
        )
        
        logger.info(f"Successful Firebase SSO login for user: {payload.email}")
        
        # Return compatible token format
        return {
            "success": True,
            "message": "Login successful",
            "token": f"mock-token-{user_id}-email-{payload.email}-{int(datetime.now().timestamp())}",
            "user": {
                "id": user_obj["id"],
                "name": user_obj["full_name"],
                "email": user_obj["email"],
                "role": user_obj["role"],
                "department": user_obj["department"],
                "profile_image": user_obj["profile_image"],
                "created_at": str(user_obj["created_at"]),
                "last_login": str(user_obj["last_login"]),
                "login_provider": user_obj.get("login_provider", "Google")
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Firebase backend login failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Firebase login failed: {str(e)}")

@router.get("/profile")
def get_profile(email: str):
    """Loads user profile details."""
    try:
        users = execute_query(
            "SELECT id, full_name, email, role, department, phone, status, profile_image, created_date, last_login, login_provider FROM users WHERE email = %s",
            (email,)
        )
        if not users:
            logger.warning(f"Profile lookup failed: email {email} not found")
            raise HTTPException(status_code=404, detail="User profile not found.")
        return users[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Profile loading failed for email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile loading failed: {str(e)}")
