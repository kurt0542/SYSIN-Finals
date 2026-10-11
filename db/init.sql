-- Database schema for PlaylistHub

CREATE TABLE IF NOT EXISTS songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id INT REFERENCES playlists(id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id)
);

-- Seed initial songs
INSERT INTO songs (title, artist, genre, duration_seconds) VALUES
('Blinding Lights', 'The Weeknd', 'Synthpop', 200),
('Levitating', 'Dua Lipa', 'Pop', 203),
('Shape of You', 'Ed Sheeran', 'Pop', 233),
('Bohemian Rhapsody', 'Queen', 'Rock', 354),
('Hotel California', 'Eagles', 'Classic Rock', 390),
('Bad Guy', 'Billie Eilish', 'Electropop', 194),
('Stay', 'The Kid LAROI & Justin Bieber', 'Pop', 141),
('Smells Like Teen Spirit', 'Nirvana', 'Grunge', 301)
ON CONFLICT DO NOTHING;

-- Seed a default playlist
INSERT INTO playlists (id, name) VALUES (1, 'Campus Hits')
ON CONFLICT DO NOTHING;

INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3)
ON CONFLICT DO NOTHING;
