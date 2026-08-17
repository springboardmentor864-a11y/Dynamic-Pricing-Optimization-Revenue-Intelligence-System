# Troubleshooting & Diagnostics Guide

This document lists solutions to common problems encountered when configuring, building, or running the PricePilot AI system.

---

## 🚫 Database Connectivity Issues

### Symptom:
`SQL execution error on PostgreSQL` or `OperationalError: could not connect to server`

### Resolution Steps:
1. **Verify local service is running**:
   - **Windows**: Run `Get-Service postgresql*` in PowerShell. If stopped, start it.
   - **Docker**: Run `docker compose ps` to verify that `pricepilot-db` status is `Up` and `healthy`.
2. **Double check environment credentials**: Inspect host, port, user, and password properties in `.env`.
3. **Verify matching firewall rules**: If connecting to a remote database, verify your current client IP is allowed.

---

## 🤖 Google Gemini API Errors

### Symptom:
`Failed to initialize Gemini: GOOGLE_API_KEY is not defined in environment variables` or `API_KEY_INVALID`

### Resolution Steps:
1. **Developer Sandbox Check**: Omit the `GOOGLE_API_KEY` env variable. The backend will intercept this and fall back to local mock outputs (keeping execution online without keys).
2. **Key configuration check**: If a live key is needed, ensure it is set as `GOOGLE_API_KEY` (not `VITE_GOOGLE_API_KEY`) in the environment where the Uvicorn/Docker process is launched.

---

## ⚡ Rate Limiting: 429 Too Many Requests

### Symptom:
Client receives `HTTP 429 Too Many Requests` or `Rate limit exceeded` messages on bulk requests.

### Resolution Steps:
1. **Reason**: The API is protected by custom RateLimitMiddleware limiting incoming calls to `120` per minute per IP.
2. **Increase Thresholds**: If your organization requires bulk telemetry pulls, configure the `RATE_LIMIT_PER_MINUTE` environment variable to a higher value (e.g. `500`).


