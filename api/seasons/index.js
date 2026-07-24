const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { sendJson } = require("../../lib/http");

// GET    /api/seasons    -> list all seasons, most recent start date first
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
  }

  try {
    const seasons = await query(
      "SELECT id, name, startDate, endDate, activeSeason FROM seasons ORDER BY startDate DESC"
    );
    return sendJson(res, 200, seasons);
  } catch (err) {
    console.error("Failed to list seasons", err);
    return sendJson(res, 500, { error: "Failed to fetch seasons" });
  }
};
