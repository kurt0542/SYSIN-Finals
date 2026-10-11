import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from datetime import datetime
from app.main import app
from app.models import SongCreate
from app.db import get_db_connection

client = TestClient(app)

def test_health_endpoint():
    """Verify health endpoint responds with HTTP 200 and expected status"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "songs-api"

def test_song_model_validation_valid():
    """Valid song payload passes validation"""
    song = SongCreate(
        title="Midnight City",
        artist="M83",
        genre="Synthwave",
        duration_seconds=244
    )
    assert song.title == "Midnight City"
    assert song.duration_seconds == 244

def test_song_model_validation_invalid_duration():
    """Rejects zero or negative durations"""
    with pytest.raises(ValidationError):
        SongCreate(title="Test", artist="Test", genre="Pop", duration_seconds=0)

    with pytest.raises(ValidationError):
        SongCreate(title="Test", artist="Test", genre="Pop", duration_seconds=-50)

    with pytest.raises(ValidationError):
        SongCreate(title="Test", artist="Test", genre="Pop", duration_seconds=5000)

def test_song_model_validation_empty_fields():
    """Rejects empty string for required fields"""
    with pytest.raises(ValidationError):
        SongCreate(title="", artist="Test", genre="Pop", duration_seconds=180)

    with pytest.raises(ValidationError):
        SongCreate(title="Test", artist="", genre="Pop", duration_seconds=180)

def test_get_songs_with_mocked_db():
    """Verify GET / returns mocked list of songs without requiring a live DB"""
    fake_songs = [
        {
            "id": 1,
            "title": "Mock Song",
            "artist": "Mock Artist",
            "genre": "Rock",
            "duration_seconds": 210,
            "created_at": datetime.now()
        }
    ]

    class MockCursor:
        def execute(self, query, params=None):
            pass
        def fetchall(self):
            return fake_songs
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

    class MockConn:
        def cursor(self):
            return MockCursor()

    def fake_db():
        yield MockConn()

    app.dependency_overrides[get_db_connection] = fake_db
    try:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Mock Song"
    finally:
        app.dependency_overrides.clear()

def test_put_song_success():
    """Verify PUT /{song_id} updates and returns the updated song"""
    updated_fake = {
        "id": 1,
        "title": "Updated Title",
        "artist": "Updated Artist",
        "genre": "Pop",
        "duration_seconds": 180,
        "created_at": datetime.now()
    }

    class MockCursor:
        def execute(self, query, params=None):
            pass
        def fetchone(self):
            return updated_fake
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

    class MockConn:
        def cursor(self):
            return MockCursor()
        def commit(self):
            pass

    def fake_db():
        yield MockConn()

    app.dependency_overrides[get_db_connection] = fake_db
    try:
        response = client.put(
            "/1",
            json={
                "title": "Updated Title",
                "artist": "Updated Artist",
                "genre": "Pop",
                "duration_seconds": 180
            }
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"
    finally:
        app.dependency_overrides.clear()

def test_put_song_not_found():
    """Verify PUT /{song_id} returns 404 when song does not exist"""
    class MockCursor:
        def execute(self, query, params=None):
            pass
        def fetchone(self):
            return None
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

    class MockConn:
        def cursor(self):
            return MockCursor()
        def commit(self):
            pass

    def fake_db():
        yield MockConn()

    app.dependency_overrides[get_db_connection] = fake_db
    try:
        response = client.put(
            "/999",
            json={
                "title": "Non-existent",
                "artist": "Artist",
                "genre": "Pop",
                "duration_seconds": 200
            }
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()

