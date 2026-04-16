const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 40000,
  connectionTimeoutMillis: 80000,
});

pool.connect()
  .then(client => {
    console.log("  PostgreSQL connected successfully");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL connection failed:", err.message);
  });

module.exports = pool;