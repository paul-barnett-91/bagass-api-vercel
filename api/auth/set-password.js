const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { readJsonBody, sendJson } = require("../../lib/http");
const { hashPassword } = require("../../lib/password");

// POST   /api/auth/set-password    -> hash and store a new password for an existing user
//
// Deliberately left unprotected for now - this is used to bootstrap the
// admin password before auth checks are added to the rest of the API.
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
    const passwordHash = await hashPassword(password);
    const result = await query("UPDATE users SET password = ? WHERE username = ?", [
      passwordHash,
      username,
    ]);

    if (result.affectedRows === 0) {
      return sendJson(res, 404, { error: "User not found" });
    }

    return sendJson(res, 200, { username });
  } catch (err) {
    console.error("Failed to set password", err);
    return sendJson(res, 500, { error: "Failed to set password" });
  }
};
