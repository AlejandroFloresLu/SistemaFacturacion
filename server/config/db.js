/**
 * db.js — Pool de conexión a PostgreSQL
 * Usa las variables de entorno definidas en .env
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host:            process.env.DB_HOST     || 'localhost',
    user:            process.env.DB_USER     || 'postgres',
    password:        process.env.DB_PASSWORD || '',
    database:        process.env.DB_NAME     || 'factu',
    port:            parseInt(process.env.DB_PORT || '5432'),
    // Forzar UTF-8 en cada conexión (crítico en Windows donde pg puede negociar WIN1252)
    options:         '-c client_encoding=UTF8',
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = pool;
