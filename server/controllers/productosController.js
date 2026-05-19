/**
 * productosController.js — CRUD de Productos
 * Opera sobre la tabla `productos` en PostgreSQL.
 */
const pool = require('../config/db');

/** GET /api/productos — Listar todos los productos activos */
async function getAll(req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT id_producto, codigo, descripcion, precio
             FROM productos
             WHERE estado = true
             ORDER BY codigo`
        );
        const data = rows.map(r => ({
            id:    r.codigo,
            desc:  r.descripcion,
            price: parseFloat(r.precio),
            dbId:  r.id_producto,
        }));
        return res.json(data);
    } catch (err) {
        console.error('[productosController.getAll]', err);
        return res.status(500).json({ error: 'Error al obtener productos.' });
    }
}

/** GET /api/productos/buscar?term=... — Buscar por código o descripción */
async function buscar(req, res) {
    const { term } = req.query;
    if (!term) return res.status(400).json({ error: 'Parámetro term requerido.' });
    try {
        const { rows } = await pool.query(
            `SELECT id_producto, codigo, descripcion, precio
             FROM productos
             WHERE estado=true AND (
                 LOWER(codigo) = LOWER($1) OR
                 LOWER(descripcion) LIKE LOWER($2)
             )
             LIMIT 10`,
            [term, `%${term}%`]
        );
        const data = rows.map(r => ({
            id:    r.codigo,
            desc:  r.descripcion,
            price: parseFloat(r.precio),
            dbId:  r.id_producto,
        }));
        return res.json(data);
    } catch (err) {
        console.error('[productosController.buscar]', err);
        return res.status(500).json({ error: 'Error en la búsqueda.' });
    }
}

/** POST /api/productos — Crear nuevo producto */
async function create(req, res) {
    const { codigo, descripcion, precio } = req.body;
    if (!codigo || !descripcion || !precio) {
        return res.status(400).json({ error: 'Código, descripción y precio son obligatorios.' });
    }
    if (isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO productos (codigo, descripcion, precio, estado)
             VALUES ($1, $2, $3, true)
             RETURNING id_producto`,
            [codigo.toUpperCase(), descripcion, parseFloat(precio)]
        );
        return res.status(201).json({ ok: true, id: rows[0].id_producto });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un producto con ese código.' });
        }
        console.error('[productosController.create]', err);
        return res.status(500).json({ error: 'Error al crear el producto.' });
    }
}

/** PUT /api/productos/:id — Actualizar producto */
async function update(req, res) {
    const { id } = req.params;
    const { descripcion, precio } = req.body;
    if (!descripcion) return res.status(400).json({ error: 'La descripción es obligatoria.' });
    if (isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un número positivo.' });
    }
    try {
        const { rowCount } = await pool.query(
            `UPDATE productos SET descripcion=$1, precio=$2
             WHERE codigo=$3 AND estado=true`,
            [descripcion, parseFloat(precio), id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
        return res.json({ ok: true });
    } catch (err) {
        console.error('[productosController.update]', err);
        return res.status(500).json({ error: 'Error al actualizar el producto.' });
    }
}

/** DELETE /api/productos/:id — Soft-delete del producto */
async function remove(req, res) {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query(
            `UPDATE productos SET estado=false WHERE codigo=$1 AND estado=true`,
            [id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
        return res.json({ ok: true });
    } catch (err) {
        console.error('[productosController.remove]', err);
        return res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
}

module.exports = { getAll, buscar, create, update, remove };
