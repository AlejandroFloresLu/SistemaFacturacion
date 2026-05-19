const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const ctrl    = require('../controllers/cargaMasivaController');

// Aceptar CSV únicamente (XLSX requeriría xlsx como dep; se recomienda convertir en frontend)
const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 },  // 10 MB
    fileFilter: (_req, file, cb) => {
        const name = file.originalname.toLowerCase();
        const mime = file.mimetype;
        const ok   = name.endsWith('.csv')
                  || mime === 'text/csv'
                  || mime === 'text/plain'
                  || mime === 'application/csv';
        if (!ok) {
            return cb(new Error('Solo se aceptan archivos .CSV'));
        }
        cb(null, true);
    },
});

// Manejador de errores de multer (tipo de archivo)
function handleMulter(req, res, next) {
    upload.single('file')(req, res, err => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}

// ── Rutas de carga masiva ─────────────────────────────────────────────────────
router.post('/', handleMulter, ctrl.uploadFile);

module.exports = router;
