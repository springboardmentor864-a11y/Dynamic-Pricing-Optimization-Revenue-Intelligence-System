# ==========================================================
# PricePilot AI - Authentication & Authorization Router
# JWT Authentication + Role Based Access Control (Admin & User)
# ==========================================================

import re
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List

try:
    from database import get_db
    from models import User, ActivityLog, Notification, PasswordResetOTP
    from schemas import (
        UserLogin, UserRegister, Token, UserResponse,
        RefreshTokenRequest, UserProfileUpdate, OTPRequest, OTPVerify, PasswordReset
    )
    from security import (
        verify_password, get_password_hash,
        create_access_token, create_refresh_token, decode_access_token
    )
except ImportError:
    from backend.database import get_db
    from backend.models import User, ActivityLog, Notification, PasswordResetOTP
    from backend.schemas import (
        UserLogin, UserRegister, Token, UserResponse,
        RefreshTokenRequest, UserProfileUpdate, OTPRequest, OTPVerify, PasswordReset
    )
    from backend.security import (
        verify_password, get_password_hash,
        create_access_token, create_refresh_token, decode_access_token
    )

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


# ==========================================================
# Role-Based Authorization Dependencies
# ==========================================================

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter((User.username == username) | (User.email == username)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact system administrator.",
        )
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforces Admin role authorization."""
    role_normalized = current_user.role.strip().lower()
    if role_normalized not in ["admin", "administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin authorization required."
        )
    return current_user


def require_user(current_user: User = Depends(get_current_user)) -> User:
    """Enforces active user authentication."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account inactive."
        )
    return current_user


# ==========================================================
# Registration API Endpoint
# ==========================================================

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Validate input fields
    clean_name = data.name.strip()
    clean_email = data.email.strip().lower()
    clean_username = data.username.strip()
    password = data.password
    phone = data.phone_number.strip() if data.phone_number else None

    if not clean_name:
        raise HTTPException(status_code=400, detail="Full name is required.")

    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=400, detail="Invalid email format.")

    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Check duplicate email or username
    existing_email = db.query(User).filter(User.email == clean_email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    existing_username = db.query(User).filter(User.username == clean_username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username is already taken. Please choose another.")

    # First registered user becomes approved Admin, subsequent become pending Users
    is_first_user = db.query(User).count() == 0
    role = "Admin" if is_first_user else "User"
    is_approved = is_first_user
    user_status = "approved" if is_first_user else "pending"

    hashed_pwd = get_password_hash(password)
    new_user = User(
        name=clean_name,
        email=clean_email,
        username=clean_username,
        password_hash=hashed_pwd,
        phone_number=phone,
        role=role,
        is_active=True,
        is_approved=is_approved,
        status=user_status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create activity log & notification for admin
    log = ActivityLog(user_id=new_user.id, action=f"New user registered: {new_user.username} ({new_user.email}) - Status: {user_status}")
    db.add(log)

    notification = Notification(
        title="New User Registration",
        message=f"User {new_user.name} (@{new_user.username}) registered and requires administrator approval.",
        type="warning" if not is_approved else "info"
    )
    db.add(notification)
    db.commit()

    return {
        "message": "Account registered successfully! Please wait for administrator approval before logging in." if not is_approved else "Admin account created successfully! You may now log in.",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "username": new_user.username,
            "role": new_user.role,
            "is_approved": new_user.is_approved,
            "status": new_user.status,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }
    }


# ==========================================================
# Login API Endpoint (Email or Username Support + Approval Check)
# ==========================================================

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    identifier = credentials.username.strip()
    password = credentials.password

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/email and password are required."
        )

    # Allow login by email or username
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify username/email and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact system administrator.",
        )

    # Check user approval & status
    if not getattr(user, "is_approved", True) or getattr(user, "status", "approved") == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending admin approval. You will be able to log in once an administrator approves your account.",
        )

    if getattr(user, "status", "approved") == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended by administrator. Contact support.",
        )

    # Update last login timestamp
    user.last_login = datetime.utcnow()
    role_display = "Admin" if user.role.lower() in ["admin", "administrator"] else "User"

    # Log successful login
    log = ActivityLog(user_id=user.id, action=f"User {user.username} ({role_display}) logged in.")
    db.add(log)
    db.commit()

    token_payload = {
        "sub": user.username,
        "role": role_display,
        "name": user.name,
        "email": user.email,
        "id": user.id
    }
    access_token = create_access_token(data=token_payload)
    refresh_token = create_refresh_token(data=token_payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "role": role_display,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "is_approved": getattr(user, "is_approved", True),
            "status": getattr(user, "status", "approved"),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }


# ==========================================================
# ==========================================================
# Forgot Password & OTP Endpoints (Real Enterprise Security)
# ==========================================================

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import Request

try:
    from config import (
        SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_USE_TLS,
        TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    )
except ImportError:
    from backend.config import (
        SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_USE_TLS,
        TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    )

def dispatch_real_otp(destination: str, otp_code: str, user_name: str) -> dict:
    """Dispatches real OTP via Twilio SMS or SMTP Email with detailed diagnostics."""
    is_phone = "+" in destination or destination.replace("-", "").replace(" ", "").isdigit()
    
    # 1. Try Twilio SMS if destination is phone number and Twilio is configured
    if is_phone and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            client.messages.create(
                body=f"PricePilot AI Password Recovery Code: {otp_code}. Valid for 5 minutes.",
                from_=TWILIO_PHONE_NUMBER,
                to=destination
            )
            return {"success": True, "method": "SMS"}
        except Exception as twilio_err:
            print(f"Twilio SMS Error: {twilio_err}. Attempting SMTP Email fallback...")

    # 2. Validate SMTP credentials existence & placeholders
    active_user = SMTP_USERNAME or SMTP_USER
    if not active_user or not SMTP_PASSWORD:
        return {
            "success": False,
            "error": "Environment variables not loaded: SMTP_USERNAME or SMTP_PASSWORD is missing in backend/.env"
        }

    if "yourgmail@gmail.com" in active_user.lower() or "YOUR_16_CHARACTER" in SMTP_PASSWORD:
        return {
            "success": False,
            "error": "Invalid Gmail App Password: Standard placeholder credentials detected in backend/.env. Please update SMTP_USERNAME and SMTP_PASSWORD with your real Gmail address and 16-character App Password."
        }

    # 3. Attempt Real SMTP Dispatch with granular exception catching
    try:
        import socket
        target_email = destination if "@" in destination else active_user
        from_email = SMTP_FROM or active_user

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "PricePilot AI Password Recovery"
        msg["From"] = from_email
        msg["To"] = target_email
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #070b14; color: #ffffff; padding: 30px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; padding: 25px; border-radius: 16px;">
              <h2 style="color: #7c3aed; margin-top: 0;">PricePilot AI</h2>
              <h3 style="color: #ffffff;">Password Recovery One-Time Password</h3>
              <p style="color: #94a3b8;">Hello {user_name},</p>
              <p style="color: #cbd5e1;">Your One-Time Password is:</p>
              <div style="background-color: #1e293b; color: #38bdf8; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 18px; text-align: center; border-radius: 12px; margin: 20px 0;">
                {otp_code}
              </div>
              <p style="color: #f59e0b; font-size: 13px;">⏰ Valid for 5 minutes. If you did not request this password reset, please ignore this email.</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html_content, "html"))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(active_user, SMTP_PASSWORD)
            server.sendmail(from_email, [target_email], msg.as_string())
        
        return {"success": True, "method": "Email"}

    except smtplib.SMTPAuthenticationError as auth_err:
        error_msg = f"SMTP authentication failed: Invalid Gmail App Password or username. ({auth_err.smtp_code} {auth_err.smtp_error.decode() if isinstance(auth_err.smtp_error, bytes) else auth_err.smtp_error})"
        print(f"SMTP Auth Failure: {error_msg}")
        return {"success": False, "error": error_msg}

    except (smtplib.SMTPConnectError, socket.gaierror, TimeoutError) as net_err:
        error_msg = f"SMTP server unreachable ({SMTP_HOST}:{SMTP_PORT}). Check network connection."
        print(f"SMTP Network Error: {error_msg} ({net_err})")
        return {"success": False, "error": error_msg}

    except smtplib.SMTPException as smtp_err:
        error_msg = f"SMTP Protocol Error: {str(smtp_err)}"
        print(error_msg)
        return {"success": False, "error": error_msg}

    except Exception as general_err:
        error_msg = f"Email Dispatch Error: {str(general_err)}"
        print(f"SMTP Unexpected Error: {error_msg}")
        return {"success": False, "error": error_msg}


@router.post("/forgot-password")
@router.post("/forgot-password/request-otp")
def request_otp(data: OTPRequest, request: Request, db: Session = Depends(get_db)):
    clean_identifier = data.identifier.strip().lower()
    if not clean_identifier:
        raise HTTPException(status_code=400, detail="Email or Phone Number is required.")

    # Find user by email, username, or phone
    user = db.query(User).filter(
        (User.email == clean_identifier) | 
        (User.username == clean_identifier) | 
        (User.phone_number == clean_identifier)
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account registered with provided email or phone number.")

    # Rate limiting: max 3 OTP requests per 15 minutes
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
    recent_otps_count = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.created_at >= fifteen_mins_ago
    ).count()

    if recent_otps_count >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Maximum 3 resend attempts per 15 minutes.")

    # Invalidate previous active OTPs for this user
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.is_used == False
    ).update({"is_used": True})

    # Generate secure 6-digit OTP code
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Dispatch via Twilio SMS or SMTP Email BEFORE storing/committing
    dispatch_res = dispatch_real_otp(clean_identifier, otp_code, user.name or user.username)

    if not dispatch_res.get("success"):
        raise HTTPException(
            status_code=500,
            detail=dispatch_res.get("error", "Failed to deliver OTP via SMS/Email. Service not configured.")
        )

    # Save OTP record in PostgreSQL
    otp_record = PasswordResetOTP(
        user_id=user.id,
        email_or_phone=clean_identifier,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False,
        attempts=0,
        ip_address=client_ip
    )
    db.add(otp_record)

    log = ActivityLog(user_id=user.id, action=f"OTP sent to {clean_identifier} via {dispatch_res.get('method')}")
    db.add(log)
    db.commit()

    return {
        "message": f"A 6-digit verification code has been sent to {clean_identifier}.",
        "expires_in_minutes": 5
    }


@router.post("/forgot-password/verify-otp")
@router.post("/verify-otp")
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):
    clean_identifier = data.identifier.strip().lower()
    clean_otp = data.otp_code.strip()

    if len(clean_otp) != 6 or not clean_otp.isdigit():
        raise HTTPException(status_code=400, detail="OTP must be a valid 6-digit number.")

    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email_or_phone == clean_identifier,
        PasswordResetOTP.is_used == False
    ).order_by(PasswordResetOTP.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No active OTP found for this account. Please request a new OTP.")

    # Increment verification attempt counter
    otp_record.attempts = (otp_record.attempts or 0) + 1
    db.commit()

    if otp_record.attempts > 5:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Maximum OTP verification attempts (5) exceeded. Please request a new OTP.")

    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP code expired (5-minute limit). Please request another OTP.")

    if otp_record.otp_code != clean_otp:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP code. {5 - otp_record.attempts} attempts remaining."
        )

    return {
        "message": "OTP verified successfully. Proceed to reset password.",
        "verified": True
    }


@router.post("/forgot-password/reset-password")
@router.post("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    clean_identifier = data.identifier.strip().lower()
    clean_otp = data.otp_code.strip()
    new_pwd = data.new_password.strip()

    if len(new_pwd) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email_or_phone == clean_identifier,
        PasswordResetOTP.otp_code == clean_otp,
        PasswordResetOTP.is_used == False
    ).order_by(PasswordResetOTP.created_at.desc()).first()

    if not otp_record or datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP session. Please restart recovery flow.")

    user = db.query(User).filter(User.id == otp_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Hash new password with bcrypt & invalidate OTP
    user.password_hash = get_password_hash(new_pwd)
    otp_record.is_used = True

    log = ActivityLog(user_id=user.id, action=f"User {user.username} successfully reset password via OTP.")
    db.add(log)
    db.commit()

    return {"message": "Password updated successfully! You can now log in with your new password."}


# ==========================================================
# Refresh Token API Endpoint
# ==========================================================

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_access_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found.",
        )

    role_display = "Admin" if user.role.lower() in ["admin", "administrator"] else "User"

    token_payload = {
        "sub": user.username,
        "role": role_display,
        "name": user.name,
        "email": user.email,
        "id": user.id
    }
    new_access_token = create_access_token(data=token_payload)
    new_refresh_token = create_refresh_token(data=token_payload)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "role": role_display,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "is_approved": getattr(user, "is_approved", True),
            "status": getattr(user, "status", "approved"),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }


# ==========================================================
# Current User Info & Profile Update API Endpoints
# ==========================================================

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows users to edit their profile (name, email, username, phone, avatar, password)."""
    if data.name and data.name.strip():
        current_user.name = data.name.strip()

    if data.username and data.username.strip():
        clean_uname = data.username.strip()
        if clean_uname != current_user.username:
            if db.query(User).filter(User.username == clean_uname).first():
                raise HTTPException(status_code=400, detail="Username is already taken.")
            current_user.username = clean_uname

    if data.email and data.email.strip():
        clean_email = data.email.strip().lower()
        if not EMAIL_REGEX.match(clean_email):
            raise HTTPException(status_code=400, detail="Invalid email format.")
        
        if clean_email != current_user.email:
            existing = db.query(User).filter(User.email == clean_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already in use by another user.")
            current_user.email = clean_email

    if data.phone_number is not None:
        current_user.phone_number = data.phone_number.strip() if data.phone_number.strip() else None

    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url.strip() if data.avatar_url.strip() else None

    if data.password and data.password.strip():
        if data.current_password and not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password entered is incorrect.")
        if len(data.password.strip()) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
        current_user.password_hash = get_password_hash(data.password.strip())

    db.commit()
    db.refresh(current_user)

    log = ActivityLog(user_id=current_user.id, action=f"User {current_user.username} updated their profile.")
    db.add(log)
    db.commit()

    return current_user


# ==========================================================
# Logout API Endpoint
# ==========================================================

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = ActivityLog(user_id=current_user.id, action=f"User {current_user.username} logged out.")
    db.add(log)
    db.commit()
    return {"message": "Logged out successfully."}

