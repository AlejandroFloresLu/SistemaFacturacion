const express      = require('express');
const router       = express.Router();
const pool         = require('../config/db');
const verifyToken  = require('../middleware/verifyToken');

// Requiere autenticación
router.use(verifyToken);

/** GET /api/metodos-pago — Listar métodos de pago activos */
router.get('/', async (_req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id_metodo AS id, nombre FROM metodos_pago WHERE activo = true ORDER BY id_metodo`
        );
        return res.json(rows);
    } catch (err) {
        console.error('[metodosPago.getAll]', err);
        return res.status(500).json({ error: 'Error al obtener métodos de pago.' });
    }
});

module.exports = router;
