import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.utils.db import init_database

class TestProductionReadySystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize test database schemas
        init_database()
        cls.client = TestClient(app)

    def test_liveness_health_check(self):
        """Verify that /health liveness endpoint is online."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("timestamp", data)

    def test_readiness_check(self):
        """Verify that /ready endpoint performs database and AI checks."""
        res = self.client.get("/ready")
        self.assertIn(res.status_code, [200, 503])
        data = res.json()
        self.assertIn("status", data)
        self.assertIn("checks", data)
        self.assertIn("database", data["checks"])
        self.assertIn("ai_service", data["checks"])

    def test_unauthorized_user_access(self):
        """Verify that list_users rejects requests without authentication."""
        res = self.client.get("/api/users")
        self.assertEqual(res.status_code, 401)
        data = res.json()
        self.assertEqual(data["success"], False)
        self.assertTrue("credential" in data["error"].lower() or "auth" in data["error"].lower())

    def test_invalid_token_access(self):
        """Verify that list_users rejects requests with invalid tokens."""
        res = self.client.get("/api/users", headers={"Authorization": "Bearer invalid-signature-token"})
        self.assertEqual(res.status_code, 401)

    def test_authorized_admin_access(self):
        """Verify that list_users permits authorized Admin access."""
        headers = {"Authorization": "Bearer mock-token-usr-admin-001-123456"}
        res = self.client.get("/api/users", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)

    def test_pricing_endpoint_validation_failure(self):
        """Verify that invalid payload to price predictor returns 422 error."""
        invalid_payload = {
            "category": "utilidades_domesticas",
            "freight": "not-a-number",  # triggers validation error
            "weight": 800.0
        }
        res = self.client.post("/api/predict", json=invalid_payload)
        self.assertEqual(res.status_code, 422)

    def test_ai_copilot_validation_failure(self):
        """Verify that empty prompts to AI chat are rejected with validation error."""
        invalid_payload = {
            "message": ""  # empty message validation
        }
        headers = {"Authorization": "Bearer mock-token-usr-admin-001-123456"}
        res = self.client.post("/api/ai/chat", json=invalid_payload, headers=headers)
        self.assertEqual(res.status_code, 422)

    def test_ai_copilot_success(self):
        """Verify AI chat copilot endpoint returns successful response."""
        payload = {
            "message": "Optimize strategy for housewares catalog."
        }
        headers = {"Authorization": "Bearer mock-token-usr-admin-001-123456"}
        res = self.client.post("/api/ai/chat", json=payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("response", data["data"])

if __name__ == "__main__":
    unittest.main()
