// Application entrypoint. Hit directly via api/index.js, and via the "/"
// rewrite in vercel.json, to show a human-readable list of the API's routes.
const ENDPOINTS = [
  { method: 'GET', path: '/api/boardgames', description: 'List all boardgames' },
  { method: 'POST', path: '/api/boardgames', description: 'Create a boardgame' },
  { method: 'GET', path: '/api/boardgames/:id', description: 'Fetch a single boardgame' },
  { method: 'PUT', path: '/api/boardgames/:id', description: 'Update a single boardgame' },
];

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const rows = ENDPOINTS.map(
    (e) => `<tr><td>${e.method}</td><td><code>${e.path}</code></td><td>${e.description}</td></tr>`
  ).join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Boardgame Library API</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    table { border-collapse: collapse; }
    th, td { text-align: left; padding: 0.4rem 1rem 0.4rem 0; }
    th { border-bottom: 2px solid #ccc; }
    code { background: #f0f0f0; padding: 0.1rem 0.3rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Boardgame Library API</h1>
  <table>
    <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
};
