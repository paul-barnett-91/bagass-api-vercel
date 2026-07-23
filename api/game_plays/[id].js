const { query, withTransaction } = require("../../lib/db");
const { applyCors } = require("../../lib/cors");
const { getQuery, readJsonBody, sendJson } = require("../../lib/http");
const { validateResults, insertResults } = require("../../lib/gamePlayResults");

// PUT    /api/game_plays/:id    -> add/update notes, moment, and/or results on an existing game play
module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  const { id } = getQuery(req);

  if (!id || Number.isNaN(Number(id))) {
    return sendJson(res, 400, { error: "A numeric id is required" });
  }

  if (req.method === "PUT") {
    return handlePut(req, res, id);
  }

  res.setHeader("Allow", "PUT, OPTIONS");
  return sendJson(res, 405, { error: `Method ${req.method} not allowed` });
};

async function handlePut(req, res, id) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const { notes, moment, results } = body;

  if (notes === undefined && moment === undefined && results === undefined) {
    return sendJson(res, 400, { error: "At least one of notes, moment, or results is required" });
  }

  if (results !== undefined) {
    const error = validateResults(results);
    if (error) {
      return sendJson(res, 400, { error });
    }
  }

  try {
    const found = await withTransaction(async (txQuery) => {
      const setClauses = [];
      const params = [];

      if (notes !== undefined) {
        setClauses.push("notes = ?");
        params.push(notes);
      }
      if (moment !== undefined) {
        setClauses.push("moment = ?");
        params.push(moment);
      }

      if (setClauses.length > 0) {
        const updateResult = await txQuery(
          `UPDATE game_plays SET ${setClauses.join(", ")} WHERE id = ?`,
          [...params, id]
        );
        if (updateResult.affectedRows === 0) {
          return false;
        }
      } else {
        const existing = await txQuery("SELECT id FROM game_plays WHERE id = ?", [id]);
        if (existing.length === 0) {
          return false;
        }
      }

      if (results !== undefined) {
        await txQuery("DELETE FROM game_play_results WHERE gamePlayId = ?", [id]);
        await insertResults(txQuery, id, results);
      }

      return true;
    });

    if (!found) {
      return sendJson(res, 404, { error: "Game play not found" });
    }

    const [gamePlay] = await query(
      "SELECT id, gameId, season, notes, moment FROM game_plays WHERE id = ?",
      [id]
    );
    const gamePlayResults = await query(
      "SELECT playerId, position, points FROM game_play_results WHERE gamePlayId = ? ORDER BY position",
      [id]
    );

    return sendJson(res, 200, { ...gamePlay, results: gamePlayResults });
  } catch (err) {
    console.error("Failed to update game play", err);
    return sendJson(res, 500, { error: "Failed to update game play" });
  }
}
