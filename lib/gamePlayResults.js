// Shared validation + persistence for the optional `results` array accepted
// by POST /api/game_plays and PUT /api/game_plays/:id.

function validateResults(results) {
  if (!Array.isArray(results)) {
    return "results must be an array";
  }

  for (const r of results) {
    if (!r || r.playerId == null || r.position == null || r.points == null) {
      return "each result requires playerId, position, and points";
    }
  }

  return null;
}

async function insertResults(txQuery, gamePlayId, results) {
  for (const r of results) {
    await txQuery(
      "INSERT INTO game_play_results (gamePlayId, playerId, position, points) VALUES (?, ?, ?, ?)",
      [gamePlayId, r.playerId, r.position, r.points]
    );
  }
}

module.exports = { validateResults, insertResults };
