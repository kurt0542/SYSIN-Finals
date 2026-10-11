from fastapi import FastAPI, Depends, HTTPException, Query, status
from typing import List, Optional
import psycopg
from app.models import SongCreate, SongUpdate, SongResponse
from app.db import get_db_connection

app = FastAPI(title="Songs Catalog API", version="1.0.0")

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Health endpoint for container and proxy checks"""
    return {"status": "ok", "service": "songs-api"}

@app.get("/", response_model=List[SongResponse])
def get_songs(
    genre: Optional[str] = None,
    q: Optional[str] = None,
    conn: psycopg.Connection = Depends(get_db_connection)
):
    """Retrieve all songs with optional filtering by genre or search query"""
    query = "SELECT id, title, artist, genre, duration_seconds, created_at FROM songs WHERE 1=1"
    params = []

    if genre:
        query += " AND LOWER(genre) = LOWER(%s)"
        params.append(genre)
    if q:
        query += " AND (LOWER(title) LIKE LOWER(%s) OR LOWER(artist) LIKE LOWER(%s))"
        params.extend([f"%{q}%", f"%{q}%"])

    query += " ORDER BY id ASC"

    with conn.cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()
        return [dict(row) for row in rows]

@app.get("/{song_id}", response_model=SongResponse)
def get_song(song_id: int, conn: psycopg.Connection = Depends(get_db_connection)):
    """Retrieve a single song by ID"""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, title, artist, genre, duration_seconds, created_at FROM songs WHERE id = %s",
            (song_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Song with id {song_id} not found")
        return dict(row)

@app.post("/", response_model=SongResponse, status_code=status.HTTP_201_CREATED)
def create_song(song: SongCreate, conn: psycopg.Connection = Depends(get_db_connection)):
    """Create a new song record"""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO songs (title, artist, genre, duration_seconds)
            VALUES (%s, %s, %s, %s)
            RETURNING id, title, artist, genre, duration_seconds, created_at
            """,
            (song.title, song.artist, song.genre, song.duration_seconds)
        )
        new_song = cur.fetchone()
        conn.commit()
        return dict(new_song)

@app.put("/{song_id}", response_model=SongResponse)
def update_song(song_id: int, song: SongUpdate, conn: psycopg.Connection = Depends(get_db_connection)):
    """Update an existing song record"""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE songs
            SET title = %s, artist = %s, genre = %s, duration_seconds = %s
            WHERE id = %s
            RETURNING id, title, artist, genre, duration_seconds, created_at
            """,
            (song.title, song.artist, song.genre, song.duration_seconds, song_id)
        )
        updated_song = cur.fetchone()
        if not updated_song:
            raise HTTPException(status_code=404, detail=f"Song with id {song_id} not found")
        conn.commit()
        return dict(updated_song)

@app.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(song_id: int, conn: psycopg.Connection = Depends(get_db_connection)):
    """Delete a song by ID"""
    with conn.cursor() as cur:
        cur.execute("DELETE FROM songs WHERE id = %s RETURNING id", (song_id,))
        deleted = cur.fetchone()
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Song with id {song_id} not found")
        conn.commit()
        return None
