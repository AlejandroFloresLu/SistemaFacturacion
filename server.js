require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Frontend estático ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rutas API ───────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./server/routes/auth'));
app.use('/api/clientes',      require('./server/routes/clientes'));
app.use('/api/productos',     require('./server/routes/productos'));
app.use('/api/facturas',      require('./server/routes/facturas'));
app.use('/api/carga',         require('./server/routes/cargaMasiva'));
app.use('/api/metodos-pago',  require('./server/routes/metodosPago'));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'FACTU API funcionando correctamente' });
});

// ── Fallback SPA ────────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Ruta de API no encontrada' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Iniciar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 FACTU Server corriendo en http://localhost:${PORT}`);
    console.log(`📦 API disponible en http://localhost:${PORT}/api/health`);
});
