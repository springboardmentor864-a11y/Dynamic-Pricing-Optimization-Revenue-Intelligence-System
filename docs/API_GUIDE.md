# API Documentation & Reference Guide

This document describes the primary API endpoints exposed by the PricePilot AI system.

---

## 🛠️ Pricing & Predictions

### 1. Predict Retail Price
*   **Method & Path**: `POST /api/predict`
*   **Description**: Analyzes catalog attributes and runs pricing prediction.
*   **Headers**: `Authorization: Bearer <ID_TOKEN>` (Required if credentials verified)
*   **Request Payload**:
    ```json
    {
      "category": "utilidades_domesticas",
      "freight": 15.50,
      "weight": 800.0,
      "length": 25.0,
      "height": 12.0,
      "width": 18.0,
      "photos": 3,
      "name_length": 45,
      "description_length": 450,
      "mode": "best",
      "selected_model": "XGBoost Regressor",
      "product_id": "sim-001",
      "product_name": "Premium Kitchen Bowls"
    }
    ```
*   **Response Payload**:
    ```json
    {
      "success": true,
      "data": {
        "recommended_price": 61.70,
        "confidence": 0.8228,
        "champion_model": "XGBoost Regressor"
      }
    }
    ```

---

## 📈 Demand & Forecasting

### 2. Time-Series Demand Projection
*   **Method & Path**: `POST /api/demand/forecast`
*   **Description**: Projects sales volumes and target safety stock sizes.
*   **Request Payload**:
    ```json
    {
      "product_id": "sim-001",
      "historical_sales": [10, 12, 15, 9, 14, 18, 20],
      "days_to_forecast": 90
    }
    ```
*   **Response Payload**:
    ```json
    {
      "success": true,
      "data": {
        "product_id": "sim-001",
        "forecasted_sales": [21, 22, 24, 25, 23, 22],
        "suggested_safety_stock": 45,
        "expected_revenue": 1357.40
      }
    }
    ```

---

## 🧠 Enterprise AI Assistant

### 3. Strategy Explanation
*   **Method & Path**: `POST /api/ai/explain-price`
*   **Request Payload**:
    ```json
    {
      "category": "utilidades_domesticas",
      "predicted_price": 61.70,
      "r2_score": 0.8228,
      "algorithm": "XGBoost Regressor"
    }
    ```
*   **Response Payload**:
    ```json
    {
      "success": true,
      "data": {
        "success": true,
        "response": "The recommended price of 61.70 takes advantage of high category search coefficients...",
        "model": "gemini"
      }
    }
    ```

### 4. Interactive Copilot Chat
*   **Method & Path**: `POST /api/ai/chat`
*   **Request Payload**:
    ```json
    {
      "message": "Optimize strategy for housewares catalog."
    }
    ```
*   **Response Payload**:
    ```json
    {
      "success": true,
      "data": {
        "success": true,
        "response": "To optimize housewares yields, bundle products matching high density indicators...",
        "model": "gemini"
      }
    }
    ```

---

## 🚦 System Probes

### 5. Health Liveness
*   **Method & Path**: `GET /health`
*   **Response**:
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-07-30T14:24:15.001Z",
      "version": "3.0.0"
    }
    ```

### 6. Health Readiness
*   **Method & Path**: `GET /ready`
*   **Response**:
    ```json
    {
      "status": "ready",
      "timestamp": "2026-07-30T14:24:15.001Z",
      "checks": {
        "database": {
          "status": "ok",
          "error": null
        },
        "ai_service": {
          "status": "ok",
          "error": null
        }
      }
    }
    ```
