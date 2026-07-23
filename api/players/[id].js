const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { getQuery, readJsonBody, sendJson } = require("../../lib/http");
const { requireAuth } = require("../../lib/auth");

// GET    /api/players/:id    -> fetch a single player
// PUT    /api/players/:id    -> update a single player (requires auth)
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
    if (!requireAuth(req, res)) return;
    return handlePut(req, res, id);
  }

  res.setHeader("Allow", "GET, PUT, OPTIONS");
  return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
};

async function handleGet(req, res, id) {
  try {
    const players = await query("SELECT id, name FROM members WHERE id = ?", [id]);

    if (players.length === 0) {
      return sendJson(res, 404, { error: "Player not found" });
    }

    return sendJson(res, 200, players[0]);
  } catch (err) {
    console.error("Failed to fetch player", err);
    return sendJson(res, 500, { error: "Failed to fetch player" });
  }
}

async function handlePut(req, res, id) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const { name } = body;

  if (!name) {
    return sendJson(res, 400, { error: "name is required" });
  }

  try {
    const result = await query("UPDATE members SET name = ? WHERE id = ?", [name, id]);

    if (result.affectedRows === 0) {
      return sendJson(res, 404, { error: "Player not found" });
    }

    return sendJson(res, 200, { id: Number(id), name });
  } catch (err) {
    console.error("Failed to update player", err);
    return sendJson(res, 500, { error: "Failed to update player" });
  }
}
