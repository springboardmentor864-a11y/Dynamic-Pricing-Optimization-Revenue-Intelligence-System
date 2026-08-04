# PricePilot

This project has a FastAPI backend and a React + Vite frontend.

## 1. Backend

Open PowerShell in the project root:

```powershell
cd "D:\Priceplot ai\Dynamic-Pricing-Optimization-Revenue-Intelligence-System"
python -m pip install fastapi uvicorn psycopg2-binary python-dotenv
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The API will be available at:
- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs

Available endpoints:
- http://127.0.0.1:8000/products
- http://127.0.0.1:8000/forecast
- http://127.0.0.1:8000/recommendations

Make sure your PostgreSQL connection details are set in the environment used by the backend.

## 2. Frontend

Open a second PowerShell window:

```powershell
cd "D:\Priceplot ai\Dynamic-Pricing-Optimization-Revenue-Intelligence-System\frontend"
npm install
npm run dev
```

The frontend will be available at:
- http://127.0.0.1:5173

## 3. Notes

- The frontend expects the backend at http://127.0.0.1:8000.
- If the API is not reachable, the app will show an error message instead of crashing.
