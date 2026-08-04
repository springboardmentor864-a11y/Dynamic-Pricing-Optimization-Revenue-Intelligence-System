from fastapi import FastAPI
from database import cursor
from fastapi.middleware.cors import CORSMiddleware

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
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    return {"data": rows}

@app.get("/forecast")
def get_forecast():
    cursor.execute("SELECT * FROM demand_forecasts")
    rows = cursor.fetchall()
    return {"data": rows}

@app.get("/recommendations")
def get_recommendations():
    cursor.execute("SELECT * FROM price_recommendations")
    rows = cursor.fetchall()
    return {"data": rows}