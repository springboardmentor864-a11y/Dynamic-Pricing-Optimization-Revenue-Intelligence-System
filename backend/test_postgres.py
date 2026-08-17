import os
import psycopg2
from dotenv import load_dotenv

print("Current directory:", os.getcwd())
print("Script directory:", os.path.dirname(os.path.abspath(__file__)))

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
print("Looking for:", dotenv_path)
print("Exists:", os.path.exists(dotenv_path))

load_dotenv(dotenv_path)

print("DB_HOST:", os.getenv("DB_HOST"))
print("DB_PORT:", os.getenv("DB_PORT"))
print("DB_NAME:", os.getenv("DB_NAME"))
print("DB_USER:", os.getenv("DB_USER"))
print("DB_PASSWORD:", os.getenv("DB_PASSWORD"))

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
)

print("✅ PostgreSQL Connected Successfully!")

conn.close()