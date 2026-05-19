/**
 * test-db.js — Prueba de conexión a PostgreSQL
 * Ejecutar con: node test-db.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'factu',
    port:     parseInt(process.env.DB_PORT || '5432'),
});

async function testConnection() {
    console.log('\n========================================');
    console.log('   FACTU — Prueba de Conexión a BD     ');
    console.log('========================================');
    console.log(`Host:     ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Puerto:   ${process.env.DB_PORT || '5432'}`);
    console.log(`Base:     ${process.env.DB_NAME || 'factu'}`);
    console.log(`Usuario:  ${process.env.DB_USER || 'postgres'}`);
    console.log('----------------------------------------\n');

    let client;
    try {
        client = await pool.connect();
        console.log('✅ CONEXIÓN EXITOSA a PostgreSQL\n');

        // Verificar versión de PostgreSQL
        const pgVersion = await client.query('SELECT version()');
        console.log('📌 Versión:', pgVersion.rows[0].version.split(',')[0]);

        // Verificar tablas del schema
        console.log('\n--- Verificando tablas del schema ---');
        const tablas = ['roles', 'usuarios', 'clientes', 'productos', 'facturas', 'factura_detalles'];
        for (const tabla of tablas) {
            try {
                const res = await client.query(`SELECT COUNT(*) FROM ${tabla}`);
                console.log(`  ✅ ${tabla.padEnd(20)} → ${res.rows[0].count} registros`);
            } catch (e) {
                console.log(`  ❌ ${tabla.padEnd(20)} → NO EXISTE (ejecuta schema.sql)`);
            }
        }

        // Verificar usuario admin
        console.log('\n--- Verificando usuario admin ---');
        try {
            const adminRes = await client.query("SELECT username, estado FROM usuarios WHERE username = 'admin'");
            if (adminRes.rows.length > 0) {
                const u = adminRes.rows[0];
                console.log(`  ✅ Usuario 'admin' encontrado (estado: ${u.estado ? 'activo' : 'inactivo'})`);
            } else {
                console.log("  ⚠️  Usuario 'admin' NO existe → ejecuta: npm run seed");
            }
        } catch (e) {
            console.log("  ❌ No se pudo verificar usuario (tabla usuarios no existe)");
        }

        console.log('\n========================================');
        console.log('   Todo listo. Puedes iniciar el servidor con:');
        console.log('   npm run dev');
        console.log('========================================\n');

    } catch (err) {
        console.error('❌ ERROR DE CONEXIÓN:', err.message);
        console.error('\n💡 Posibles causas:');
        console.error('   1. PostgreSQL no está corriendo');
        console.error('   2. La base de datos "factu" no existe');
        console.error('   3. Usuario/contraseña incorrectos en .env');
        console.error('\n💡 Pasos para solucionar:');
        console.error('   1. Inicia PostgreSQL');
        console.error('   2. Crea la BD: CREATE DATABASE factu;');
        console.error('   3. Ejecuta schema: psql -U postgres -d factu -f server/db/schema.sql');
        console.error('   4. Crea admin: npm run seed\n');
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

testConnection();
