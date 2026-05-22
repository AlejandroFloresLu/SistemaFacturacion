'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos del frontend ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API — todas las rutas se registran en server/routes/index.js ─────────────
app.use('/api', require('./server/routes'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Fallback SPA (rutas no-API devuelven index.html) ────────────────────────
app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Ruta de API no encontrada.' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Manejador global de errores no capturados ────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[server] Error no capturado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

// ── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 FACTU corriendo en http://localhost:${PORT}`);
});
