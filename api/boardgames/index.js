const { query } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');

// GET    /api/boardgames        -> list all boardgames
// POST   /api/boardgames        -> create a boardgame
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};

async function handleGet(req, res) {
  try {
    // Placeholder query - adjust table/column names to match the real schema.
    const games = await query(
      'SELECT id, title, publisher, min_players, max_players, play_time_minutes FROM boardgames ORDER BY title'
    );
    return res.status(200).json(games);
  } catch (err) {
    console.error('Failed to list boardgames', err);
    return res.status(500).json({ error: 'Failed to fetch boardgames' });
  }
}

async function handlePost(req, res) {
  const { title, publisher, min_players, max_players, play_time_minutes } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    // Placeholder insert - adjust table/column names to match the real schema.
    const result = await query(
      'INSERT INTO boardgames (title, publisher, min_players, max_players, play_time_minutes) VALUES (?, ?, ?, ?, ?)',
      [title, publisher || null, min_players || null, max_players || null, play_time_minutes || null]
    );

    return res.status(201).json({
      id: result.insertId,
      title,
      publisher: publisher || null,
      min_players: min_players || null,
      max_players: max_players || null,
      play_time_minutes: play_time_minutes || null,
    });
  } catch (err) {
    console.error('Failed to create boardgame', err);
    return res.status(500).json({ error: 'Failed to create boardgame' });
  }
}
