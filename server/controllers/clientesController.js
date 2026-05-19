/**
 * clientesController.js — CRUD de Clientes
 * Opera sobre la tabla `clientes` en PostgreSQL.
 */
const pool = require('../config/db');

/** GET /api/clientes — Listar todos los clientes activos */
async function getAll(req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT id_cliente, ruc_o_cedula, nombres, apellidos, telefono, email, ultima_compra
             FROM clientes
             WHERE estado = true
             ORDER BY apellidos, nombres`
        );
        // Normalizar al formato que espera el frontend
        const data = rows.map(r => ({
            id:           r.id_cliente,
            ruc:          r.ruc_o_cedula,
            nombre:       r.nombres,
            apellido:     r.apellidos,
            tel:          r.telefono   || '',
            email:        r.email      || '(sin correo)',
            ultimaCompra: r.ultima_compra || 'Nuevo',
        }));
        return res.json(data);
    } catch (err) {
        console.error('[clientesController.getAll]', err);
        return res.status(500).json({ error: 'Error al obtener clientes.' });
    }
}

/** POST /api/clientes — Crear nuevo cliente */
async function create(req, res) {
    const { ruc, nombre, apellido, tel, email } = req.body;
    if (!ruc || !nombre || !apellido) {
        return res.status(400).json({ error: 'RUC, nombre y apellido son obligatorios.' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO clientes (ruc_o_cedula, nombres, apellidos, telefono, email, ultima_compra, estado)
             VALUES ($1, $2, $3, $4, $5, 'Nuevo', true)
             RETURNING id_cliente`,
            [ruc, nombre, apellido, tel || null, email || null]
        );
        return res.status(201).json({ ok: true, id: rows[0].id_cliente });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un cliente con ese RUC/Cédula.' });
        }
        console.error('[clientesController.create]', err);
        return res.status(500).json({ error: 'Error al crear el cliente.' });
    }
}

/** PUT /api/clientes/:id — Actualizar datos del cliente */
async function update(req, res) {
    const { id } = req.params;
    const { nombre, apellido, tel, email } = req.body;
    if (!nombre || !apellido) {
        return res.status(400).json({ error: 'Nombre y apellido son obligatorios.' });
    }
    try {
        const { rowCount } = await pool.query(
            `UPDATE clientes
             SET nombres=$1, apellidos=$2, telefono=$3, email=$4
             WHERE id_cliente=$5 AND estado=true`,
            [nombre, apellido, tel || null, email || null, id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }
        return res.json({ ok: true });
    } catch (err) {
        console.error('[clientesController.update]', err);
        return res.status(500).json({ error: 'Error al actualizar el cliente.' });
    }
}

/** DELETE /api/clientes/:id — Soft-delete del cliente */
async function remove(req, res) {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query(
            `UPDATE clientes SET estado=false WHERE id_cliente=$1 AND estado=true`,
            [id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }
        return res.json({ ok: true });
    } catch (err) {
        console.error('[clientesController.remove]', err);
        return res.status(500).json({ error: 'Error al eliminar el cliente.' });
    }
}

/** GET /api/clientes/buscar?ruc=... — Buscar por RUC o cédula */
async function buscarPorRuc(req, res) {
    const { ruc } = req.query;
    if (!ruc) return res.status(400).json({ error: 'Parámetro ruc requerido.' });
    try {
        const { rows } = await pool.query(
            `SELECT id_cliente, ruc_o_cedula, nombres, apellidos, telefono, email, ultima_compra
             FROM clientes WHERE ruc_o_cedula=$1 AND estado=true`,
            [ruc]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado.' });
        const r = rows[0];
        return res.json({
            id:           r.id_cliente,
            ruc:          r.ruc_o_cedula,
            nombre:       r.nombres,
            apellido:     r.apellidos,
            tel:          r.telefono || '',
            email:        r.email    || '(sin correo)',
            ultimaCompra: r.ultima_compra || 'Nuevo',
        });
    } catch (err) {
        console.error('[clientesController.buscarPorRuc]', err);
        return res.status(500).json({ error: 'Error en la búsqueda.' });
    }
}

module.exports = { getAll, create, update, remove, buscarPorRuc };
