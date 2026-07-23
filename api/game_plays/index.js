const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { getQuery, sendJson } = require("../../lib/http");

// GET    /api/game_plays?season=<season>    -> list plays for a season, with game name joined in
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
  }

  const { season } = getQuery(req);

  if (!season) {
    return sendJson(res, 400, { error: "season is required" });
  }

  try {
    const plays = await query(
      `SELECT gp.id, gp.gameId, g.name AS gameName, gp.notes, gp.season, gp.moment
       FROM game_plays gp
       JOIN games g ON g.id = gp.gameId
       WHERE gp.season = ?
       ORDER BY gp.moment`,
      [season]
    );
    return sendJson(res, 200, plays);
  } catch (err) {
    console.error("Failed to fetch game plays", err);
    return sendJson(res, 500, { error: "Failed to fetch game plays" });
  }
};
