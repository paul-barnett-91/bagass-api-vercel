const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { readJsonBody, sendJson } = require("../../lib/http");
const { requireAuth } = require("../../lib/auth");

// GET    /api/games        -> list all games
// POST   /api/games        -> create a game (requires auth)
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "POST") {
    if (!requireAuth(req, res)) return;
    return handlePost(req, res);
  }

  res.setHeader("Allow", "GET, POST, OPTIONS");
  return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
};

async function handleGet(req, res) {
  try {
    // Placeholder query - adjust table/column names to match the real schema.
    const games = await query(
      "SELECT id, name, minPlayers, maxPlayers, playTimeMinutes FROM games ORDER BY name"
    );
    return sendJson(res, 200, games);
  } catch (err) {
    console.error("Failed to list games", err);
    return sendJson(res, 500, { error: "Failed to fetch games" });
  }
}

async function handlePost(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const { name, minPlayers, maxPlayers, playTimeMinutes } = body;

  if (!name) {
    return sendJson(res, 400, { error: "name is required" });
  }

  try {
    // Placeholder insert - adjust table/column names to match the real schema.
    const result = await query(
      "INSERT INTO games (name, minPlayers, maxPlayers, playTimeMinutes) VALUES (?, ?, ?, ?)",
      [name, minPlayers || null, maxPlayers || null, playTimeMinutes || null]
    );

    return sendJson(res, 201, {
      id: result.insertId,
      name,
      minPlayers: minPlayers || null,
      maxPlayers: maxPlayers || null,
      playTimeMinutes: playTimeMinutes || null,
    });
  } catch (err) {
    console.error("Failed to create game", err);
    return sendJson(res, 500, { error: "Failed to create game" });
  }
}
