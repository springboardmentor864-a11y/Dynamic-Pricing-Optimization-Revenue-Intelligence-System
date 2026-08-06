from fastapi import FastAPI
from database import get_db_connection
from fastapi.middleware.cors import CORSMiddleware
import psycopg2.extras  # <-- We added this import so we can use RealDictCursor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "PricePilot Backend Running"}

@app.get("/products")
def get_products():
    conn = get_db_connection()
    # Notice the cursor_factory added here!
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) 
    try:
        cursor.execute("SELECT * FROM products")
        rows = cursor.fetchall()
        return {"data": rows}
    finally:
        cursor.close()
        conn.close()

@app.get("/forecast")
def get_forecast():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("SELECT * FROM demand_forecasts")
        rows = cursor.fetchall()
        return {"data": rows}
    finally:
        cursor.close()
        conn.close()

@app.get("/recommendations")
def get_recommendations():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("SELECT * FROM price_recommendations")
        rows = cursor.fetchall()
        return {"data": rows}
    finally:
        cursor.close()
        conn.close()