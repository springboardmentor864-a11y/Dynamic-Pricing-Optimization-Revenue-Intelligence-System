import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

SECRET_KEY = "pricepilot-enterprise-ai-secret-key-springboard-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# SMTP Email Configurations
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER") or ""
SMTP_USER = SMTP_USERNAME
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM") or SMTP_USERNAME or "no-reply@pricepilot.ai"
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "t")

# Twilio SMS Configurations
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

def print_smtp_status():
    masked_pwd = (SMTP_PASSWORD[:2] + "*" * max(0, len(SMTP_PASSWORD) - 2)) if SMTP_PASSWORD else "None"
    print("\n==================================================")
    print(" PricePilot AI SMTP Environment Configuration")
    print("==================================================")
    print(f"  SMTP_HOST:     {SMTP_HOST or 'None'}")
    print(f"  SMTP_PORT:     {SMTP_PORT or 'None'}")
    print(f"  SMTP_USERNAME: {SMTP_USERNAME or 'None'}")
    print(f"  SMTP_PASSWORD: {masked_pwd}")
    print(f"  SMTP_FROM:     {SMTP_FROM or 'None'}")
    print(f"  SMTP_USE_TLS:  {SMTP_USE_TLS}")
    
    missing = []
    if not SMTP_HOST: missing.append("SMTP_HOST")
    if not SMTP_USERNAME: missing.append("SMTP_USERNAME")
    if not SMTP_PASSWORD: missing.append("SMTP_PASSWORD")
    
    if missing:
        print(f"  STATUS: [WARNING] Missing environment variables: {', '.join(missing)}")
    elif "yourgmail@gmail.com" in SMTP_USERNAME or "YOUR_16_CHARACTER" in SMTP_PASSWORD:
        print("  STATUS: [WARNING] Placeholder credentials detected in backend/.env")
        print("  NOTE: Please replace 'yourgmail@gmail.com' and 'YOUR_16_CHARACTER_GMAIL_APP_PASSWORD' with your real Gmail address and 16-character App Password.")
    else:
        print("  STATUS: [SUCCESS] Real SMTP Credentials Loaded")
    print("==================================================\n")

print_smtp_status()