const mysql = require('mysql2/promise');

// Reuse the pool across warm serverless invocations instead of creating
// a new one (and exhausting MariaDB connections) on every request.
let pool = global._mariaPool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_CA_CERT
        ? { ca: process.env.DB_CA_CERT, rejectUnauthorized: true }
        : undefined,
      waitForConnections: true,
      connectionLimit: 5,
      maxIdle: 5,
      idleTimeout: 60000,
      queueLimit: 0,
    });
    global._mariaPool = pool;
  }
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

// Runs fn with a single connection wrapped in a transaction, committing on
// success and rolling back if fn throws. fn receives a query(sql, params)
// bound to that connection.
async function withTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const txQuery = async (sql, params) => {
      const [rows] = await conn.execute(sql, params);
      return rows;
    };
    const result = await fn(txQuery);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getPool, query, withTransaction };
