const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { readJsonBody, sendJson } = require("../../lib/http");
const { requireAuth } = require("../../lib/auth");

// GET    /api/players        -> list all players
// POST   /api/players        -> create a player (requires auth)
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
    const players = await query("SELECT id, name FROM members ORDER BY name");
    return sendJson(res, 200, players);
  } catch (err) {
    console.error("Failed to list players", err);
    return sendJson(res, 500, { error: "Failed to fetch players" });
  }
}

async function handlePost(req, res) {
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
    const result = await query("INSERT INTO members (name) VALUES (?)", [name]);

    return sendJson(res, 201, { id: result.insertId, name });
  } catch (err) {
    console.error("Failed to create player", err);
    return sendJson(res, 500, { error: "Failed to create player" });
  }
}
