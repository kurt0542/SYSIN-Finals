const express = require('express');
const cors = require('cors');
const db = require('./db');
const { computeTotalDuration, formatDuration } = require('./duration');

const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint for container checks and smoke tests
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'playlist-api' });
});

// List all playlists with calculated totals
app.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.created_at,
        COUNT(ps.song_id)::int AS song_count,
        COALESCE(SUM(s.duration_seconds), 0)::int AS total_duration_seconds
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      LEFT JOIN songs s ON ps.song_id = s.id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    const playlists = result.rows.map((row) => ({
      ...row,
      total_duration_label: formatDuration(row.total_duration_seconds),
    }));

    res.json(playlists);
  } catch (err) {
    console.error('Error fetching playlists:', err);
    res.status(500).json({ error: 'Failed to retrieve playlists' });
  }
});

// Get playlist by ID with list of songs
app.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const playlistResult = await db.query(
      'SELECT id, name, created_at FROM playlists WHERE id = $1',
      [id]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: `Playlist ${id} not found` });
    }

    const playlist = playlistResult.rows[0];

    const songsResult = await db.query(
      `
      SELECT s.id, s.title, s.artist, s.genre, s.duration_seconds, ps.position, ps.added_at
      FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      WHERE ps.playlist_id = $1
      ORDER BY ps.position ASC, ps.added_at ASC
    `,
      [id]
    );

    const totalSeconds = computeTotalDuration(songsResult.rows);

    res.json({
      ...playlist,
      songs: songsResult.rows,
      song_count: songsResult.rows.length,
      total_duration_seconds: totalSeconds,
      total_duration_label: formatDuration(totalSeconds),
    });
  } catch (err) {
    console.error(`Error fetching playlist ${id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve playlist details' });
  }
});

// Create a new playlist
app.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO playlists (name) VALUES ($1) RETURNING id, name, created_at',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating playlist:', err);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Add a song to a playlist
app.post('/:id/songs', async (req, res) => {
  const { id } = req.params;
  const { song_id } = req.body;

  if (!song_id) {
    return res.status(400).json({ error: 'song_id is required' });
  }

  try {
    // Check if playlist exists
    const plCheck = await db.query('SELECT id FROM playlists WHERE id = $1', [id]);
    if (plCheck.rows.length === 0) {
      return res.status(404).json({ error: `Playlist ${id} not found` });
    }

    // Check if song exists
    const songCheck = await db.query('SELECT id FROM songs WHERE id = $1', [song_id]);
    if (songCheck.rows.length === 0) {
      return res.status(404).json({ error: `Song ${song_id} not found` });
    }

    // Check if song is already in playlist
    const duplicateCheck = await db.query(
      'SELECT song_id FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
      [id, song_id]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Song is already in this playlist' });
    }

    // Get current max position
    const posResult = await db.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM playlist_songs WHERE playlist_id = $1',
      [id]
    );
    const nextPos = posResult.rows[0].next_pos;

    await db.query(
      'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)',
      [id, song_id, nextPos]
    );

    res.status(201).json({ message: 'Song added to playlist successfully', playlist_id: Number(id), song_id });
  } catch (err) {
    console.error('Error adding song to playlist:', err);
    res.status(500).json({ error: 'Failed to add song to playlist' });
  }
});

// Remove a song from a playlist
app.delete('/:id/songs/:songId', async (req, res) => {
  const { id, songId } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING song_id',
      [id, songId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not in playlist' });
    }
    res.status(200).json({ message: 'Song removed from playlist' });
  } catch (err) {
    console.error('Error removing song from playlist:', err);
    res.status(500).json({ error: 'Failed to remove song' });
  }
});

// Delete playlist
app.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM playlists WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting playlist:', err);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

module.exports = app;
