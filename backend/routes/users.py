from fastapi import APIRouter, HTTPException, Depends
from backend.utils.firebase import require_roles
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid
import re
from backend.utils.db import execute_query
from backend.utils.security import hash_password
from backend.utils.logger import logger

router = APIRouter(prefix="/api/users", tags=["Users"])

class CreateUserRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str
    department: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[^@\s]+@[^\s@]+\.[^\s@]+$", v):
            raise ValueError("Invalid email address format.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = ["Admin", "Manager", "Viewer"]
        if v not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return v

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    profile_image: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["Admin", "Manager", "Viewer"]
            if v not in allowed:
                raise ValueError(f"Role must be one of: {', '.join(allowed)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["Active", "Suspended"]
            if v not in allowed:
                raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v

@router.get("")
def list_users(current_user: dict = Depends(require_roles(["Admin", "Manager"]))):
    """Returns a list of all system users."""
    try:
        users = execute_query(
            "SELECT id, full_name, email, role, department, phone, created_date, last_login, status, profile_image FROM users ORDER BY created_date DESC"
        )
        return users
    except Exception as e:
        logger.error(f"Failed to list users: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve users list due to an internal server error.")

@router.post("")
def create_user(payload: CreateUserRequest, current_user: dict = Depends(require_roles(["Admin"]))):
    """Creates a new enterprise user account with hashed password storage."""
    try:
        # Check if email is duplicate
        existing = execute_query("SELECT id FROM users WHERE email = %s", (payload.email,))
        if existing:
            raise HTTPException(status_code=400, detail="A user with this email address already exists.")
            
        uid = f"usr-{str(uuid.uuid4())[:8]}"
        created = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Hash the password securely
        hashed_pwd = hash_password(payload.password)
        
        # Insert user
        execute_query(
            """
            INSERT INTO users (
                id, name, email, password_hash, role, created_at,
                full_name, password, department, phone, created_date, status, profile_image
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                uid,
                payload.full_name, # name
                payload.email,
                hashed_pwd, # password_hash
                payload.role,
                created, # created_at
                payload.full_name, # full_name
                hashed_pwd, # password (legacy column)
                payload.department,
                payload.phone,
                created, # created_date
                "Active",
                payload.profile_image or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
            ),
            is_write=True
        )
        
        # Insert event log to activity_logs table for audit trail timeline
        execute_query(
            """
            INSERT INTO activity_logs (user_id, user_email, action, module, description, details, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                current_user.get("uid", "usr-admin-001"),
                current_user.get("email", "admin@pricepilot.ai"),
                "Create User",
                "Users",
                f"Provisioned account for {payload.email}",
                f"Full Name: {payload.full_name}, Role: {payload.role}, Department: {payload.department}",
                created
            ),
            is_write=True
        )
        
        logger.info(f"Created new user account: ID {uid}, email {payload.email}, role {payload.role}")
        return {"status": "success", "message": "User created successfully.", "user_id": uid}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to create user: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create user due to an internal database error.")

@router.put("/{user_id}")
def update_user(user_id: str, payload: UpdateUserRequest, current_user: dict = Depends(require_roles(["Admin"]))):
    """Updates user information."""
    try:
        users = execute_query("SELECT * FROM users WHERE id = %s", (user_id,))
        if not users:
            raise HTTPException(status_code=404, detail="User not found.")
            
        # Build dynamic updates
        updates = []
        params = []
        
        if payload.full_name is not None:
            updates.append("full_name = %s")
            params.append(payload.full_name)
            updates.append("name = %s")
            params.append(payload.full_name)
        if payload.role is not None:
            updates.append("role = %s")
            params.append(payload.role)
        if payload.department is not None:
            updates.append("department = %s")
            params.append(payload.department)
        if payload.phone is not None:
            updates.append("phone = %s")
            params.append(payload.phone)
        if payload.status is not None:
            updates.append("status = %s")
            params.append(payload.status)
        if payload.profile_image is not None:
            updates.append("profile_image = %s")
            params.append(payload.profile_image)
            
        if not updates:
            return {"status": "success", "message": "No parameters provided to update."}
            
        params.append(user_id)
        update_str = ", ".join(updates)
        execute_query(
            f"UPDATE users SET {update_str} WHERE id = %s",
            tuple(params),
            is_write=True
        )
        
        # Insert audit trail event
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        execute_query(
            """
            INSERT INTO activity_logs (user_id, user_email, action, module, description, details, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                current_user.get("uid", "usr-admin-001"),
                current_user.get("email", "admin@pricepilot.ai"),
                "Update User",
                "Users",
                f"Modified properties for user account {user_id}",
                f"Updated columns: {', '.join([u.split(' =')[0] for u in updates])}",
                now_str
            ),
            is_write=True
        )
        
        logger.info(f"Updated profile for user ID: {user_id}")
        return {"status": "success", "message": "User profile updated successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to update user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update user due to an internal server error.")

@router.delete("/{user_id}")
def delete_user(user_id: str, current_user: dict = Depends(require_roles(["Admin"]))):
    """Deletes a user account."""
    try:
        users = execute_query("SELECT email FROM users WHERE id = %s", (user_id,))
        if not users:
            raise HTTPException(status_code=404, detail="User not found.")
            
        user = users[0]
        if user["email"] == "admin@pricepilot.ai":
            raise HTTPException(status_code=400, detail="The root system administrator cannot be deleted.")
            
        execute_query("DELETE FROM users WHERE id = %s", (user_id,), is_write=True)
        
        # Insert audit trail event
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        execute_query(
            """
            INSERT INTO activity_logs (user_id, user_email, action, module, description, details, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                current_user.get("uid", "usr-admin-001"),
                current_user.get("email", "admin@pricepilot.ai"),
                "Delete User",
                "Users",
                f"Permanently removed user ID {user_id}",
                f"Deleted User Email: {user['email']}",
                now_str
            ),
            is_write=True
        )
        
        logger.info(f"Deleted user account: ID {user_id}, email {user['email']}")
        return {"status": "success", "message": "User account removed."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete user due to an internal server error.")
