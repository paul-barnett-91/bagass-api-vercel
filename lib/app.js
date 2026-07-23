// Application entrypoint. Hit directly via api/index.js, and via the "/"
// rewrite in vercel.json, to show a human-readable list of the API's routes.
// Deliberately not at the project root: Vercel auto-detects a root-level
// app.js/server.js as a monolithic Node.js backend and routes ALL traffic to
// it, bypassing the /api directory's per-route functions entirely.
const { sendHtml, sendJson } = require("./http");

const ENDPOINTS = [
  { method: "GET", path: "/api/games", description: "List all games" },
  { method: "POST", path: "/api/games", description: "Create a game" },
  { method: "GET", path: "/api/games/:id", description: "Fetch a single game" },
  {
    method: "PUT",
    path: "/api/games/:id",
    description: "Update a single game",
  },
  { method: "GET", path: "/api/players", description: "List all players" },
  { method: "POST", path: "/api/players", description: "Create a player" },
  {
    method: "GET",
    path: "/api/players/:id",
    description: "Fetch a single player",
  },
  {
    method: "PUT",
    path: "/api/players/:id",
    description: "Update a single player",
  },
  {
    method: "GET",
    path: "/api/game_plays?season=",
    description: "List game plays for a season (season is required)",
  },
  {
    method: "POST",
    path: "/api/game_plays",
    description: "Create a game play, optionally with its results",
  },
  {
    method: "PUT",
    path: "/api/game_plays/:id",
    description: "Add/update notes, moment, and/or results on a game play",
  },
  {
    method: "GET",
    path: "/api/results?season=",
    description: "League table of total points per player (season is optional)",
  },
  {
    method: "POST",
    path: "/api/auth/set-password",
    description: "Set a user's password (unprotected for now)",
  },
];

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
  }

  const rows = ENDPOINTS.map(
    (e) =>
      `<tr><td>${e.method}</td><td><code>${e.path}</code></td><td>${e.description}</td></tr>`
  ).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BAGASS Library API</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    table { border-collapse: collapse; }
    th, td { text-align: left; padding: 0.4rem 1rem 0.4rem 0; }
    th { border-bottom: 2px solid #ccc; }
    code { background: #f0f0f0; padding: 0.1rem 0.3rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>BAGASS Library API</h1>
  <table>
    <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  return sendHtml(res, 200, html);
};
