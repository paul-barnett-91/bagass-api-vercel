const { query } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');

// GET    /api/boardgames/:id    -> fetch a single boardgame
// PUT    /api/boardgames/:id    -> update a single boardgame
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  const { id } = req.query;

  if (!id || Number.isNaN(Number(id))) {
    return res.status(400).json({ error: 'A numeric id is required' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, id);
  }

  if (req.method === 'PUT') {
    return handlePut(req, res, id);
  }

  res.setHeader('Allow', 'GET, PUT, OPTIONS');
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};

async function handleGet(req, res, id) {
  try {
    const games = await query(
      'SELECT id, title, publisher, min_players, max_players, play_time_minutes FROM boardgames WHERE id = ?',
      [id]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: 'Boardgame not found' });
    }

    return res.status(200).json(games[0]);
  } catch (err) {
    console.error('Failed to fetch boardgame', err);
    return res.status(500).json({ error: 'Failed to fetch boardgame' });
  }
}

async function handlePut(req, res, id) {
  const { title, publisher, min_players, max_players, play_time_minutes } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    // Placeholder update - adjust table/column names to match the real schema.
    const result = await query(
      'UPDATE boardgames SET title = ?, publisher = ?, min_players = ?, max_players = ?, play_time_minutes = ? WHERE id = ?',
      [title, publisher || null, min_players || null, max_players || null, play_time_minutes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Boardgame not found' });
    }

    return res.status(200).json({
      id: Number(id),
      title,
      publisher: publisher || null,
      min_players: min_players || null,
      max_players: max_players || null,
      play_time_minutes: play_time_minutes || null,
    });
  } catch (err) {
    console.error('Failed to update boardgame', err);
    return res.status(500).json({ error: 'Failed to update boardgame' });
  }
}
