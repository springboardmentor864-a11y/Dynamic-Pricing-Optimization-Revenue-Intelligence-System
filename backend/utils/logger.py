import os
import logging
from logging.handlers import RotatingFileHandler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_FILE_PATH = os.path.join(BASE_DIR, "pricepilot_system.log")

# Create logger
logger = logging.getLogger("pricepilot")
logger.setLevel(logging.INFO)

# Avoid adding handlers multiple times
if not logger.handlers:
    # Console Handler
    c_handler = logging.StreamHandler()
    c_handler.setLevel(logging.INFO)
    
    # File Handler with rotation (10 MB per file, max 5 backups)
    f_handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
    f_handler.setLevel(logging.INFO)
    
    # Formatters
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s [%(name)s:%(filename)s:%(lineno)d] - %(message)s')
    c_handler.setFormatter(formatter)
    f_handler.setFormatter(formatter)
    
    # Add to logger
    logger.addHandler(c_handler)
    logger.addHandler(f_handler)
