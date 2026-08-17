# Environment Variables Reference Guide

This document describes all environment configurations used by PricePilot AI to manage security, databases, AI integration, and request rates.

---

## 🔒 Configuration Matrix

| Variable | Scope | Required | Description | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `DB_HOST` | Backend | Yes | Database host hostname | `localhost`, `db` |
| `DB_PORT` | Backend | Yes | PostgreSQL port number | `5432` |
| `DB_USER` | Backend | Yes | PostgreSQL admin username | `postgres` |
| `DB_PASSWORD`| Backend | Yes | PostgreSQL admin password | `password123` |
| `DB_NAME` | Backend | Yes | PostgreSQL database name | `pricepilot_ai` |
| `GOOGLE_API_KEY`| Backend | No | Google Gemini API credentials | `AIzaSy...` (Falls back to offline mocks if omitted) |
| `VITE_API_URL` | Frontend | No | Production server base URL | `https://api.pricepilot.com` (If blank, calls relative API routes) |
| `RATE_LIMIT_PER_MINUTE` | Backend | No | Max requests permitted per IP per minute | `120` (Defaults to `120`) |
| `LOG_LEVEL` | Backend | No | Standard system logging level | `INFO`, `DEBUG`, `WARNING` |

---

## ⚠️ Security Guidelines

1. **Never commit secrets to git**: Ensure `.env` is listed in your `.gitignore` file.
2. **Rotate API Keys**: Periodically refresh Google Gemini API keys.
3. **Restrict IP Access**: When using cloud databases (e.g. Neon, Render pg), restrict access allowed IPs in the dashboard to prevent unauthorized connections.
