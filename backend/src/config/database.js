const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: "18.206.244.149",
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'tradernex',
});

pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente do banco de dados:', err);
  process.exit(-1);
});

module.exports = pool;
