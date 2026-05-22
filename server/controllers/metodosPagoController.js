/**
 * metodosPagoController.js — Lógica de negocio para Métodos de Pago
 */
'use strict';

const pool = require('../config/db');

/** GET /api/metodos-pago — Listar métodos de pago activos */
async function getAll(_req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT id_metodo AS id, nombre FROM metodos_pago WHERE activo = true ORDER BY id_metodo`
        );
        return res.json(rows);
    } catch (err) {
        console.error('[metodosPagoController.getAll]', err);
        return res.status(500).json({ error: 'Error al obtener métodos de pago.' });
    }
}

module.exports = { getAll };
