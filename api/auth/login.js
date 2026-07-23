const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { readJsonBody, sendJson } = require("../../lib/http");
const { verifyPassword, DUMMY_HASH } = require("../../lib/password");
const jwt = require("../../lib/jwt");

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

// POST   /api/auth/login    -> verify username/password, return a JWT
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const { username, password } = body;

  if (!username || !password) {
    return sendJson(res, 400, { error: "username and password are required" });
  }

  try {
    const users = await query("SELECT id, username, password FROM users WHERE username = ?", [
      username,
    ]);
    const user = users[0];

    const isValid = await verifyPassword(password, user ? user.password : DUMMY_HASH);
    if (!user || !isValid) {
      return sendJson(res, 401, { error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      process.env.JWT_SECRET,
      TOKEN_TTL_SECONDS
    );

    return sendJson(res, 200, { token });
  } catch (err) {
    console.error("Failed to log in", err);
    return sendJson(res, 500, { error: "Failed to log in" });
  }
};
