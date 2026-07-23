const { query } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { getQuery, sendJson } = require("../../lib/http");

// GET    /api/results[?season=<season>]    -> league table: total points per player,
//                                              with first/second place counts, optionally
//                                              scoped to a season
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
  }

  const { season } = getQuery(req);

  let sql = `SELECT m.id AS playerId, m.name AS playerName,
      COALESCE(CAST(SUM(gpr.points) AS SIGNED), 0) AS totalPoints,
      CAST(SUM(CASE WHEN gpr.position = 1 THEN 1 ELSE 0 END) AS SIGNED) AS firstPlaces,
      CAST(SUM(CASE WHEN gpr.position = 2 THEN 1 ELSE 0 END) AS SIGNED) AS secondPlaces
    FROM game_play_results gpr
    JOIN members m ON m.id = gpr.playerId
    JOIN game_plays gp ON gp.id = gpr.gamePlayId`;
  const params = [];

  if (season) {
    sql += " WHERE gp.season = ?";
    params.push(season);
  }

  sql += " GROUP BY m.id, m.name ORDER BY totalPoints DESC, firstPlaces DESC";

  try {
    const results = await query(sql, params);
    return sendJson(res, 200, results);
  } catch (err) {
    console.error("Failed to fetch results", err);
    return sendJson(res, 500, { error: "Failed to fetch results" });
  }
};
