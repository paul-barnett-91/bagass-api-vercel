const { createClient } = require("@libsql/client");

let client = global._libsqlClient;

function getClient() {
  if (!client) {
    if (!process.env.TURSO_URL) {
      throw new Error("TURSO_URL is required");
    }

    client = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_TOKEN,
    });
    global._libsqlClient = client;
  }

  return client;
}

function isReadQuery(sql) {
  return /^\s*(SELECT|WITH|PRAGMA|EXPLAIN)\b/i.test(sql);
}

function normalizeRows(rows) {
  return rows.map((row) => ({ ...row }));
}

function normalizeResult(result, sql) {
  if (isReadQuery(sql)) {
    return normalizeRows(result.rows);
  }

  return {
    affectedRows: result.rowsAffected,
    insertId:
      result.lastInsertRowid === undefined ? undefined : Number(result.lastInsertRowid),
  };
}

async function execute(executor, sql, params) {
  const result = await executor.execute({
    sql,
    args: params || [],
  });

  return normalizeResult(result, sql);
}

async function query(sql, params) {
  return execute(getClient(), sql, params);
}

async function withTransaction(fn) {
  const transaction = await getClient().transaction("write");

  try {
    const txQuery = async (sql, params) => execute(transaction, sql, params);
    const result = await fn(txQuery);
    await transaction.commit();
    return result;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = { getClient, query, withTransaction };
