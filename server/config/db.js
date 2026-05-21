const { Pool } = require('pg');

const pool = new Pool({
  // Esto le dice al código que use la URL que pegaste en el dashboard de Render
  connectionString: process.env.DATABASE_URL,
  // Render suele requerir esta línea de SSL para evitar bloqueos de seguridad
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;