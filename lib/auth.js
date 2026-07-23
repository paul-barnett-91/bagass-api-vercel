const jwt = require("./jwt");
const { sendJson } = require("./http");

// Verifies the request's Bearer JWT. On success returns the token payload.
// On failure it sends the 401 response itself and returns null - callers
// should `return` immediately when this returns null.
function requireAuth(req, res) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    sendJson(res, 401, { error: "Missing or invalid Authorization header" });
    return null;
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload) {
    sendJson(res, 401, { error: "Invalid or expired token" });
    return null;
  }

  return payload;
}

module.exports = { requireAuth };
