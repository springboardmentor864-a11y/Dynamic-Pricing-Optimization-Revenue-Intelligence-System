import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'pricepilot-ai-super-secret-key-2026')
    
    # JWT Settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'pricepilot-jwt-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Database Configuration (MySQL with SQLite fallback for instant zero-config execution)
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'root')
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
    MYSQL_DB = os.getenv('MYSQL_DB', 'pricepilot_db')
    
    # Default to SQLite if MySQL is not available or explicitly requested
    SQLITE_PATH = BASE_DIR / 'instance' / 'pricepilot.db'
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f'sqlite:///{SQLITE_PATH}'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # ML Model Path
    BEST_MODEL_PATH = BASE_DIR / 'outputs' / 'models' / 'best_model.pkl'
    CLEANED_DATASET_PATH = BASE_DIR / 'outputs' / 'reports' / 'final_cleaned_dataset.csv'
    FEATURE_IMPORTANCE_PATH = BASE_DIR / 'outputs' / 'feature_importance' / 'feature_selection_results.csv'
    MODEL_COMPARISON_PATH = BASE_DIR / 'outputs' / 'reports' / 'model_comparison_report.csv'
