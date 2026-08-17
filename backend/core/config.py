import os
from dotenv import load_dotenv

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOTENV_PATH = os.path.join(BASE_DIR, ".env")

# Load environment configuration from .env file
if os.path.exists(DOTENV_PATH):
    load_dotenv(DOTENV_PATH)

# Retrieve variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
