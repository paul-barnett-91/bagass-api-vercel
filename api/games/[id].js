const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { getQuery, readJsonBody, sendJson } = require("../../lib/http");

// GET    /api/boardgames/:id    -> fetch a single boardgame
// PUT    /api/boardgames/:id    -> update a single boardgame
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  const { id } = getQuery(req);

  if (!id || Number.isNaN(Number(id))) {
    return sendJson(res, 400, { error: "A numeric id is required" });
  }

  if (req.method === "GET") {
    return handleGet(req, res, id);
  }

  if (req.method === "PUT") {
    return handlePut(req, res, id);
  }

  res.setHeader("Allow", "GET, PUT, OPTIONS");
  return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
};

async function handleGet(req, res, id) {
  try {
    const games = await query(
      "SELECT id, name, minPlayers, maxPlayers, playTimeMinutes FROM games WHERE id = ?",
      [id]
    );

    if (games.length === 0) {
      return sendJson(res, 404, { error: "Game not found" });
    }

    return sendJson(res, 200, games[0]);
  } catch (err) {
    console.error("Failed to fetch game", err);
    return sendJson(res, 500, { error: "Failed to fetch game" });
  }
}

async function handlePut(req, res, id) {
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
    // Placeholder update - adjust table/column names to match the real schema.
    const result = await query(
      "UPDATE games SET name = ?, minPlayers = ?, maxPlayers = ?, playTimeMinutes = ? WHERE id = ?",
      [
        name,
        minPlayers || null,
        maxPlayers || null,
        playTimeMinutes || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return sendJson(res, 404, { error: "Game not found" });
    }

    return sendJson(res, 200, {
      id: Number(id),
      name,
      minPlayers: minPlayers || null,
      maxPlayers: maxPlayers || null,
      playTimeMinutes: playTimeMinutes || null,
    });
  } catch (err) {
    console.error("Failed to update game", err);
    return sendJson(res, 500, { error: "Failed to update game" });
  }
}
