require('dotenv').config({ override: true });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '4000'),
  database: process.env.DB_NAME || 'fitapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1',
});

module.exports = pool;
