import pytest
from sqlalchemy.pool import StaticPool
from app import create_app
from app.config import Config
from app.models import db, User
from app.auth import hash_password, generate_tokens

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False},
        'poolclass': StaticPool
    }
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-jwt-secret'

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(app):
    with app.app_context():
        user = User(name='Test Admin', email='admin_test@pricepilot.ai', password_hash=hash_password('pass123'), role='Admin')
        db.session.add(user)
        db.session.commit()
        access, _ = generate_tokens(user.id, user.role)
        return access

@pytest.fixture
def analyst_token(app):
    with app.app_context():
        user = User(name='Test Analyst', email='analyst_test@pricepilot.ai', password_hash=hash_password('pass123'), role='Business Analyst')
        db.session.add(user)
        db.session.commit()
        access, _ = generate_tokens(user.id, user.role)
        return access
