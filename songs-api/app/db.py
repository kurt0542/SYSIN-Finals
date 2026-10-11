import os
import psycopg
from psycopg.rows import dict_row

def get_db_url() -> str:
    user = os.getenv("DB_USER", "playlist")
    password = os.getenv("DB_PASSWORD", "playlist_secret_pass")
    host = os.getenv("DB_HOST", "db")
    port = os.getenv("DB_PORT", "5432")
    dbname = os.getenv("DB_NAME", "playlisthub")
    return os.getenv("DATABASE_URL", f"postgresql://{user}:{password}@{host}:{port}/{dbname}")

def get_db_connection():
    """Context-manager or generator for database connections"""
    conn = psycopg.connect(get_db_url(), row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()
