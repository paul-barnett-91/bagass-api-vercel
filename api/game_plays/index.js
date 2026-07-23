const { query, withTransaction } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { getQuery, readJsonBody, sendJson } = require("../../lib/http");
const { validateResults, insertResults } = require("../../lib/gamePlayResults");
const { requireAuth } = require("../../lib/auth");

// GET    /api/game_plays?season=<season>    -> list plays for a season, with game name joined in
// POST   /api/game_plays                    -> create a game play, optionally with its results (requires auth)
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
}

async function handlePost(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const { gameId, season, notes, moment, results } = body;

  if (!gameId) {
    return sendJson(res, 400, { error: "gameId is required" });
  }

  if (!season) {
    return sendJson(res, 400, { error: "season is required" });
  }

  if (results !== undefined) {
    const error = validateResults(results);
    if (error) {
      return sendJson(res, 400, { error });
    }
  }

  try {
    const gamePlayId = await withTransaction(async (txQuery) => {
      const insertResult = await txQuery(
        "INSERT INTO game_plays (gameId, season, notes, moment) VALUES (?, ?, ?, ?)",
        [gameId, season, notes || null, moment || null]
      );

      if (results !== undefined) {
        await insertResults(txQuery, insertResult.insertId, results);
      }

      return insertResult.insertId;
    });

    return sendJson(res, 201, {
      id: gamePlayId,
      gameId,
      season,
      notes: notes || null,
      moment: moment || null,
      results: results || [],
    });
  } catch (err) {
    console.error("Failed to create game play", err);
    return sendJson(res, 500, { error: "Failed to create game play" });
  }
}
