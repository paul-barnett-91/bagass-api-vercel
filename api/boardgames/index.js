const { query } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');
const { readJsonBody, sendJson } = require('../../lib/http');

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
  return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
};

async function handleGet(req, res) {
  try {
    // Placeholder query - adjust table/column names to match the real schema.
    const games = await query(
      'SELECT id, title, publisher, min_players, max_players, play_time_minutes FROM boardgames ORDER BY title'
    );
    return sendJson(res, 200, games);
  } catch (err) {
    console.error('Failed to list boardgames', err);
    return sendJson(res, 500, { error: 'Failed to fetch boardgames' });
  }
}

async function handlePost(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: 'Invalid JSON body' });
  }

  const { title, publisher, min_players, max_players, play_time_minutes } = body;

  if (!title) {
    return sendJson(res, 400, { error: 'title is required' });
  }

  try {
    // Placeholder insert - adjust table/column names to match the real schema.
    const result = await query(
      'INSERT INTO boardgames (title, publisher, min_players, max_players, play_time_minutes) VALUES (?, ?, ?, ?, ?)',
      [title, publisher || null, min_players || null, max_players || null, play_time_minutes || null]
    );

    return sendJson(res, 201, {
      id: result.insertId,
      title,
      publisher: publisher || null,
      min_players: min_players || null,
      max_players: max_players || null,
      play_time_minutes: play_time_minutes || null,
    });
  } catch (err) {
    console.error('Failed to create boardgame', err);
    return sendJson(res, 500, { error: 'Failed to create boardgame' });
  }
}
