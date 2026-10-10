const request = require('supertest');

// Mock db module before loading app
jest.mock('../src/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

const db = require('../src/db');
const app = require('../src/app');

describe('Playlist API route tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /health returns status ok with HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('playlist-api');
  });

  test('POST / rejects empty playlist name with 400', async () => {
    const res = await request(app).post('/').send({ name: '   ' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Playlist name is required/i);
  });

  test('POST / creates playlist when name is valid', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Study Beats', created_at: new Date() }],
    });

    const res = await request(app).post('/').send({ name: 'Study Beats' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Study Beats');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO playlists'),
      ['Study Beats']
    );
  });

  test('POST /:id/songs adds song successfully when not duplicate', async () => {
    // Playlist exists
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    // Song exists
    db.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });
    // Duplicate check finds no existing association
    db.query.mockResolvedValueOnce({ rows: [] });
    // Next pos
    db.query.mockResolvedValueOnce({ rows: [{ next_pos: 1 }] });
    // Insert
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/1/songs').send({ song_id: 10 });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/added to playlist successfully/i);
  });
});

