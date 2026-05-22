/**
 * test-carga.js — Prueba la ruta /api/carga directamente con un CSV de ejemplo
 * Uso: node test-carga.js
 */
'use strict';
require('dotenv').config();

const http     = require('http');
const { parse } = require('csv-parse/sync');

// ── 1. Probar csv-parse directamente ─────────────────────────────────────────
console.log('\n=== TEST 1: csv-parse ===');
const csvStr = '\uFEFFNombre,Apellido,RUC_Cedula,Telefono,Email\r\nJuan,Perez,0102030405,0991234567,juan@test.com\r\n';
try {
    const rows = parse(csvStr, {
        columns: true, skip_empty_lines: true, trim: true, bom: true,
        relax_column_count: false,
    });
    console.log('✅ csv-parse OK. Filas:', rows.length);
    console.log('   Primera fila:', JSON.stringify(rows[0]));
} catch(e) {
    console.error('❌ csv-parse ERROR:', e.message);
}

// ── 2. Probar conexión a la base de datos ─────────────────────────────────────
console.log('\n=== TEST 2: PostgreSQL ===');
const pool = require('./server/config/db');
pool.query('SELECT COUNT(*) as total FROM clientes')
    .then(r => {
        console.log('✅ DB OK. Clientes en BD:', r.rows[0].total);
        return pool.query('SELECT ruc_o_cedula FROM clientes LIMIT 5');
    })
    .then(r => {
        console.log('   Algunos RUCs existentes:', r.rows.map(x=>x.ruc_o_cedula));
    })
    .catch(e => console.error('❌ DB ERROR:', e.message))
    .finally(() => {

        // ── 3. Probar multer + endpoint real con http ─────────────────────────
        console.log('\n=== TEST 3: POST /api/carga (sin token → espera 401) ===');

        const csvBuf = Buffer.from(csvStr, 'utf8');
        const boundary = 'TestBoundary99887766';
        const CRLF = '\r\n';
        
        const parts = [];
        // campo entidad
        parts.push(`--${boundary}${CRLF}`);
        parts.push(`Content-Disposition: form-data; name="entidad"${CRLF}${CRLF}`);
        parts.push(`clientes${CRLF}`);
        // campo file
        parts.push(`--${boundary}${CRLF}`);
        parts.push(`Content-Disposition: form-data; name="file"; filename="clientes.csv"${CRLF}`);
        parts.push(`Content-Type: text/csv${CRLF}${CRLF}`);
        
        const bodyStart = Buffer.from(parts.join(''), 'utf8');
        const bodyEnd   = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');
        const body      = Buffer.concat([bodyStart, csvBuf, bodyEnd]);
        
        const opts = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/carga',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length,
                // Sin token real → veremos si devuelve 401 (prueba de conexión)
            }
        };
        
        const req = http.request(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                console.log(`   HTTP Status: ${res.statusCode}`);
                console.log(`   Body: ${d.substring(0, 200)}`);
                if (res.statusCode === 401) {
                    console.log('✅ Servidor responde correctamente (401 = no token)');
                } else if (res.statusCode === 400) {
                    console.log('⚠️  Multer rechazó el archivo. Body:', d);
                } else {
                    console.log('   Status inesperado:', res.statusCode);
                }
                pool.end();
            });
        });
        req.on('error', e => {
            console.error('❌ No se pudo conectar a localhost:3000 —', e.message);
            console.error('   ¿Está corriendo el servidor? Ejecuta: npm run dev');
            pool.end();
        });
        req.write(body);
        req.end();
    });
