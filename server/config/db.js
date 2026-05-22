/**
 * config/db.js — Pool de conexión a PostgreSQL
 *
 * Soporta dos modos según las variables de entorno:
 *  - LOCAL  : DB_HOST + DB_USER + DB_PASSWORD + DB_NAME + DB_PORT  (sin SSL)
 *  - CLOUD  : DATABASE_URL  (Render / Supabase / Railway → SSL requerido)
 *
 * Para desarrollo local define las variables DB_* en el .env.
 * Para producción en Render define DATABASE_URL en el dashboard.
 */
'use strict';

const { Pool } = require('pg');

const isCloud = !!process.env.DATABASE_URL;

const pool = new Pool(
    isCloud
        // ── Producción: string de conexión + SSL obligatorio ──────────────
        ? {
            connectionString:    process.env.DATABASE_URL,
            ssl:                 { rejectUnauthorized: false },
        }
        // ── Desarrollo local: variables individuales, sin SSL ─────────────
        : {
            host:     process.env.DB_HOST     || 'localhost',
            port:     Number(process.env.DB_PORT)     || 5432,
            user:     process.env.DB_USER     || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME     || 'factu',
            ssl:      false,
        }
);

// Verificar la conexión al arrancar (log informativo, no fatal)
pool.connect()
    .then(client => {
        const target = isCloud ? process.env.DATABASE_URL.split('@')[1]?.split('/')[0] : `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`;
        console.log(`🗄️  PostgreSQL conectado → ${target} [${isCloud ? 'CLOUD' : 'LOCAL'}]`);
        client.release();
    })
    .catch(err => {
        console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
    });

module.exports = pool;