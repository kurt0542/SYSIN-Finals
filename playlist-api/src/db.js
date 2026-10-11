const { Pool } = require('pg');

const user = process.env.DB_USER || 'playlist';
const password = process.env.DB_PASSWORD || 'playlist_secret_pass';
const host = process.env.DB_HOST || 'db';
const port = process.env.DB_PORT || 5432;
const database = process.env.DB_NAME || 'playlisthub';

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${user}:${password}@${host}:${port}/${database}`;

const pool = new Pool({
  connectionString,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
