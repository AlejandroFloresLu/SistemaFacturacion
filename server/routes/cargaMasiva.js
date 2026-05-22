/**
 * routes/cargaMasiva.js — Importación masiva de clientes, productos y facturas
 *
 * El frontend convierte .xlsx → CSV (via SheetJS) y lo envía como multipart.
 * El backend parsea el CSV y hace INSERT atómico en transacción.
 */
'use strict';

const express     = require('express');
const multer      = require('multer');
const router      = express.Router();
const ctrl        = require('../controllers/cargaMasivaController');
const verifyToken = require('../middleware/verifyToken');

// ── Multer: sólo en memoria, máx 10 MB, acepta CSV ──────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const name = file.originalname.toLowerCase();
        // Normalizar MIME: los navegadores a veces envían 'text/csv;charset=utf-8'
        const mime = file.mimetype.split(';')[0].trim().toLowerCase();

        const esCSV = name.endsWith('.csv')
            || mime === 'text/csv'
            || mime === 'text/plain'
            || mime === 'application/csv'
            || mime === 'application/octet-stream'; // Blob genérico del navegador

        if (!esCSV) {
            return cb(new Error('Solo se aceptan archivos .CSV'));
        }
        cb(null, true);
    },
});

// Wrapper que devuelve el error de multer como JSON en vez de crashear
function handleMulter(req, res, next) {
    upload.single('file')(req, res, err => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}

// ── POST /api/carga — requiere autenticación ─────────────────────────────────
router.post('/', verifyToken, handleMulter, ctrl.uploadFile);

module.exports = router;
