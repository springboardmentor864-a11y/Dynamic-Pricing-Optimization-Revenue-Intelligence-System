# ==========================================================
# PricePilot AI - Project Documents Router
# Enterprise APIs for Project Proposal, SRS, ER Diagram, ML Report, etc.
# ==========================================================

import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Dict, Any, Optional

try:
    from models import User
    from routers.auth import get_current_user
except ImportError:
    from backend.models import User
    from backend.routers.auth import get_current_user

router = APIRouter(prefix="/api/docs", tags=["Project Documents"])

# Base Directory for Documents
DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "documents")
os.makedirs(DOCS_DIR, exist_ok=True)

# Document Definitions Metadata
DOCUMENTS_METADATA = [
    {
        "id": "project-proposal",
        "title": "Project Proposal",
        "category": "Requirements",
        "filename": "Project_Proposal.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-01",
        "description": "Comprehensive project proposal detailing objectives, problem statement, business scope, and team roles.",
        "icon": "file-text"
    },
    {
        "id": "srs-document",
        "title": "Software Requirements Specification (SRS)",
        "category": "Requirements",
        "filename": "SRS_Document.pdf",
        "version": "v2.1",
        "updated_date": "2026-08-02",
        "description": "Complete functional, non-functional, security, hardware, and software requirements adhering to IEEE Std 830-1998.",
        "icon": "file-code"
    },
    {
        "id": "software-design-document",
        "title": "Software Design Document (SDD)",
        "category": "Architecture",
        "filename": "Software_Design_Document.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-02",
        "description": "Enterprise component interactions, class designs, interface specifications, and architectural design patterns.",
        "icon": "box"
    },
    {
        "id": "system-architecture",
        "title": "System Architecture Document",
        "category": "Architecture",
        "filename": "System_Architecture.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-03",
        "description": "4-Tier enterprise architecture mapping React Frontend -> FastAPI Backend -> ML Engine -> PostgreSQL Database.",
        "icon": "layers"
    },
    {
        "id": "frontend-architecture",
        "title": "Frontend Architecture Specification",
        "category": "Architecture",
        "filename": "Frontend_Architecture.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-03",
        "description": "React 19 SPA architecture, component tree, state management, custom hooks, and glassmorphic UI design system.",
        "icon": "layout"
    },
    {
        "id": "backend-architecture",
        "title": "Backend Architecture Specification",
        "category": "Architecture",
        "filename": "Backend_Architecture.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-03",
        "description": "FastAPI router organization, middleware stack, SQLAlchemy ORM patterns, and openpyxl Excel compilation engine.",
        "icon": "server"
    },
    {
        "id": "database-documentation",
        "title": "Database Schema Specification",
        "category": "Database",
        "filename": "Database_Documentation.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-03",
        "description": "Detailed relational schema specifications for PostgreSQL / Neon tables including Users, Predictions, Products, Activity Logs.",
        "icon": "database"
    },
    {
        "id": "er-diagram",
        "title": "Entity Relationship (ER) Diagram",
        "category": "Database",
        "filename": "ER_Diagram.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-04",
        "description": "Visual Entity Relationship mapping primary keys, foreign keys, cardinality, and referential constraints.",
        "icon": "git-fork"
    },
    {
        "id": "api-documentation",
        "title": "REST API Documentation",
        "category": "API",
        "filename": "API_Documentation.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-04",
        "description": "API endpoints reference covering Authentication, User Management, Predictions, Analytics, and Document Export.",
        "icon": "globe"
    },
    {
        "id": "ml-report",
        "title": "Machine Learning Benchmark Report",
        "category": "Machine Learning",
        "filename": "Machine_Learning_Report.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-05",
        "description": "In-depth ML analysis evaluating Extra Trees, Random Forest, XGBoost, Gradient Boosting, Decision Tree, and Linear Regression.",
        "icon": "cpu"
    },
    {
        "id": "deployment-guide",
        "title": "Deployment & DevOps Guide",
        "category": "Deployment",
        "filename": "Deployment_Guide.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-06",
        "description": "Step-by-step production deployment instructions for Docker, Vercel frontend hosting, Render backend, and Neon PostgreSQL.",
        "icon": "cloud"
    },
    {
        "id": "installation-guide",
        "title": "Developer Installation Guide",
        "category": "Documentation",
        "filename": "Installation_Guide.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-06",
        "description": "Local environment setup instructions for Python FastAPI backend, Vite React frontend, node modules, and environment variables.",
        "icon": "terminal"
    },
    {
        "id": "developer-guide",
        "title": "Developer Contribution Guide",
        "category": "Documentation",
        "filename": "Developer_Guide.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-06",
        "description": "Codebase standards, PEP 8 guidelines, expanding FastAPI routers, extending ML feature extractors, and openpyxl formatting rules.",
        "icon": "code"
    },
    {
        "id": "admin-manual",
        "title": "Administrator Operations Manual",
        "category": "Manuals",
        "filename": "Admin_Manual.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-07",
        "description": "Admin handbook detailing user status approvals, Excel exports, ML benchmark monitoring, system metrics, and security audits.",
        "icon": "shield"
    },
    {
        "id": "user-manual",
        "title": "End User Manual",
        "category": "Manuals",
        "filename": "User_Manual.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-06",
        "description": "Comprehensive user guide covering registration, OTP verification, price prediction, history exploration, and profile settings.",
        "icon": "book-open"
    },
    {
        "id": "testing-report",
        "title": "Software Testing & QA Report",
        "category": "Quality Assurance",
        "filename": "Testing_Report.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-05",
        "description": "Automated unit tests, integration test logs, performance benchmarks, and security vulnerability audit.",
        "icon": "check-square"
    },
    {
        "id": "bug-report",
        "title": "Bug & Defect Tracking Report",
        "category": "Quality Assurance",
        "filename": "Bug_Report.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-05",
        "description": "Defect classification matrix, edge cases, input validation boundary conditions, and historical bug resolution logs.",
        "icon": "alert-circle"
    },
    {
        "id": "performance-report",
        "title": "Performance Benchmark Report",
        "category": "Quality Assurance",
        "filename": "Performance_Report.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-06",
        "description": "ML inference latency (<45ms), API gateway overhead, database query performance, and memory utilization analysis.",
        "icon": "activity"
    },
    {
        "id": "security-documentation",
        "title": "Security & Compliance Documentation",
        "category": "Security",
        "filename": "Security_Documentation.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-06",
        "description": "OWASP Top 10 mitigation strategies, Bcrypt password hashing, JWT HS256 algorithm, OTP expiry mechanics, and security headers.",
        "icon": "lock"
    },
    {
        "id": "final-report",
        "title": "Final Internship Project Report",
        "category": "Reports",
        "filename": "Final_Project_Report.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-07",
        "description": "Complete technical and managerial project report submitted for Infosys Springboard 7.0 internship completion.",
        "icon": "file-check"
    },
    {
        "id": "presentation-deck",
        "title": "Project Presentation Deck",
        "category": "Presentation",
        "filename": "Presentation_Deck.pptx",
        "version": "v2.0",
        "updated_date": "2026-08-07",
        "description": "Infosys Springboard 7.0 final project defense slide deck highlighting system architecture, ML models, and business value.",
        "icon": "monitor"
    },
    {
        "id": "research-summary",
        "title": "Dynamic Pricing Research Summary",
        "category": "Research",
        "filename": "Research_Summary.pdf",
        "version": "v2.0",
        "updated_date": "2026-08-07",
        "description": "Academic literature review and empirical findings on AI-powered dynamic pricing and Extra Trees regression superiority.",
        "icon": "compass"
    }
]


def ensure_placeholder_documents():
    """Generates professional placeholder files in backend/static/documents if they don't exist."""
    for doc in DOCUMENTS_METADATA:
        filepath = os.path.join(DOCS_DIR, doc["filename"])
        if not os.path.exists(filepath):
            content = f"""====================================================================
PRICEPILOT AI ENTERPRISE PLATFORM - OFFICIAL DOCUMENT
====================================================================
Document Title: {doc['title']}
Category       : {doc['category']}
Document ID    : {doc['id']}
Version        : {doc['version']}
Updated Date   : {doc['updated_date']}
Organization   : Infosys Springboard 7.0 (Completion: August 2026)
Authors        : Team PricePilot AI (Narendar Reddy, Manvitha, Pravallika, Ashwindh)
====================================================================

DESCRIPTION:
{doc['description']}

KEY HIGHLIGHTS:
1. Enterprise dynamic pricing model powered by Extra Trees Regressor (96.5% R² Accuracy).
2. Production REST backend built with FastAPI, SQLAlchemy ORM, and Neon PostgreSQL.
3. Modern frontend interface built with React, Vite, Tailwind CSS, and Framer Motion.
4. Complete security layer with JWT token authentication, bcrypt hashing, and OTP verification.
5. Automated Excel user data exports via openpyxl with styled tables and freeze panes.

====================================================================
CONFIDENTIAL & PROPRIETARY - PRICEPILOT AI ENTERPRISE 2026
====================================================================
"""
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
            except Exception as e:
                print(f"Error writing document {doc['filename']}: {e}")


# Initialize placeholders on module import
ensure_placeholder_documents()


@router.get("", response_model=List[Dict[str, Any]])
def list_documents(current_user: User = Depends(get_current_user)):
    """List all available project documents with file size metadata."""
    results = []
    for doc in DOCUMENTS_METADATA:
        filepath = os.path.join(DOCS_DIR, doc["filename"])
        file_size_bytes = os.path.getsize(filepath) if os.path.exists(filepath) else 1024

        if file_size_bytes < 1024:
            size_str = f"{file_size_bytes} B"
        elif file_size_bytes < 1024 * 1024:
            size_str = f"{file_size_bytes / 1024:.1f} KB"
        else:
            size_str = f"{file_size_bytes / (1024 * 1024):.1f} MB"

        doc_copy = dict(doc)
        doc_copy["file_size"] = size_str
        doc_copy["file_size_bytes"] = file_size_bytes
        results.append(doc_copy)

    return results


@router.get("/{doc_id}")
def get_document_details(doc_id: str, current_user: User = Depends(get_current_user)):
    """Get metadata and textual preview for a specific document."""
    matched = next((d for d in DOCUMENTS_METADATA if d["id"] == doc_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Document not found.")

    filepath = os.path.join(DOCS_DIR, matched["filename"])
    preview_content = ""
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                preview_content = f.read()
        except Exception:
            preview_content = f"Preview for {matched['title']} ({matched['version']})."

    doc_data = dict(matched)
    doc_data["preview"] = preview_content
    return doc_data


@router.get("/download/{doc_id}")
def download_document(doc_id: str, current_user: User = Depends(get_current_user)):
    """Download the actual document file."""
    matched = next((d for d in DOCUMENTS_METADATA if d["id"] == doc_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail="Document not found.")

    filepath = os.path.join(DOCS_DIR, matched["filename"])
    if not os.path.exists(filepath):
        ensure_placeholder_documents()

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File content not found on server.")

    return FileResponse(
        path=filepath,
        filename=matched["filename"],
        media_type="application/octet-stream"
    )
