/**
 * facturasController.js — CRUD de Facturas
 * Maneja cabecera (facturas) + detalles (factura_detalles) en transacción atómica.
 */
const pool = require('../config/db');

/** GET /api/facturas — Listar facturas con nombre de cliente */
async function getAll(req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT f.id_factura, f.codigo_factura, f.fecha, f.estado,
                    f.iva_total, f.total,
                    c.nombres || ' ' || c.apellidos AS nombre_cliente,
                    c.ruc_o_cedula
             FROM facturas f
             JOIN clientes c ON f.id_cliente = c.id_cliente
             ORDER BY f.fecha DESC`
        );
        const data = rows.map(r => ({
            id:           r.codigo_factura,
            dbId:         r.id_factura,
            fecha:        r.fecha ? r.fecha.toISOString().split('T')[0] : '',
            fechaDisplay: r.fecha ? new Date(r.fecha).toLocaleDateString('es-EC', { day:'2-digit', month:'short', year:'numeric' }) : '',
            estado:       r.estado,
            cliente:      r.nombre_cliente,
            ruc:          r.ruc_o_cedula,
            total:        parseFloat(r.total),
            iva:          parseFloat(r.iva_total),
        }));
        return res.json(data);
    } catch (err) {
        console.error('[facturasController.getAll]', err);
        return res.status(500).json({ error: 'Error al obtener facturas.' });
    }
}

/** GET /api/facturas/:id — Obtener factura con sus detalles */
async function getById(req, res) {
    const { id } = req.params;
    try {
        // Cabecera
        const facResult = await pool.query(
            `SELECT f.id_factura, f.codigo_factura, f.fecha, f.estado,
                    f.iva_total, f.total,
                    c.nombres || ' ' || c.apellidos AS nombre_cliente,
                    c.ruc_o_cedula, c.email, c.telefono
             FROM facturas f
             JOIN clientes c ON f.id_cliente = c.id_cliente
             WHERE f.codigo_factura=$1 OR f.id_factura::text=$1`,
            [id]
        );
        if (facResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada.' });
        }
        const fac = facResult.rows[0];

        // Detalles de productos
        const detResult = await pool.query(
            `SELECT codigo_producto, cantidad, precio_unitario, iva, subtotal, total_producto
             FROM factura_detalles WHERE id_factura=$1`,
            [fac.id_factura]
        );

        // Desglose de pagos (con nombre del método)
        const pagosResult = await pool.query(
            `SELECT fp.id_pago, fp.monto, fp.referencia,
                    mp.id_metodo, mp.nombre AS metodo
             FROM factura_pagos fp
             JOIN metodos_pago mp ON fp.id_metodo = mp.id_metodo
             WHERE fp.id_factura = $1
             ORDER BY fp.id_pago`,
            [fac.id_factura]
        );

        return res.json({
            id:           fac.codigo_factura,
            dbId:         fac.id_factura,
            fecha:        fac.fecha,
            estado:       fac.estado,
            total:        parseFloat(fac.total),
            iva:          parseFloat(fac.iva_total),
            cliente:      fac.nombre_cliente,
            ruc:          fac.ruc_o_cedula,
            email:        fac.email,
            telefono:     fac.telefono,
            detalles:     detResult.rows.map(d => ({
                codigo:    d.codigo_producto,
                cantidad:  d.cantidad,
                precio:    parseFloat(d.precio_unitario),
                iva:       parseFloat(d.iva),
                subtotal:  parseFloat(d.subtotal),
                total:     parseFloat(d.total_producto),
            })),
            pagos:        pagosResult.rows.map(p => ({
                idPago:     p.id_pago,
                idMetodo:   p.id_metodo,
                metodo:     p.metodo,
                monto:      parseFloat(p.monto),
                referencia: p.referencia || null,
            }))
        });
    } catch (err) {
        console.error('[facturasController.getById]', err);
        return res.status(500).json({ error: 'Error al obtener la factura.' });
    }
}

/**
 * POST /api/facturas — Crear factura (cabecera + detalles + pagos en transacción)
 * Body esperado:
 * {
 *   clienteId: number,
 *   codigoFactura: string,
 *   items: [{ codigo, cantidad, precio, iva, cantIva, subtotal, total }],
 *   ivaTotal: number,
 *   total: number,
 *   pagos: [{ idMetodo: number, monto: number, referencia?: string }]  // ← NUEVO
 * }
 * Regla de negocio: sum(pagos[].monto) debe ser igual a total (tolerancia ±0.01).
 */
async function create(req, res) {
    const { clienteId, codigoFactura, items, ivaTotal, total, pagos } = req.body;

    if (!clienteId || !codigoFactura || !items || items.length === 0 || total == null) {
        return res.status(400).json({ error: 'Datos de factura incompletos.' });
    }

    // ── Validación del desglose de pagos ────────────────────────────────────
    if (!pagos || pagos.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un método de pago.' });
    }
    for (const p of pagos) {
        if (!p.idMetodo || !p.monto || parseFloat(p.monto) <= 0) {
            return res.status(400).json({ error: 'Cada pago debe tener idMetodo y monto positivo.' });
        }
    }
    const sumaPagos = pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0);
    if (Math.abs(sumaPagos - parseFloat(total)) > 0.01) {
        return res.status(400).json({
            error: `La suma de los pagos (${sumaPagos.toFixed(2)}) no coincide con el total de la factura (${parseFloat(total).toFixed(2)}).`
        });
    }
    // ────────────────────────────────────────────────────────────────────────

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar cabecera
        const facResult = await client.query(
            `INSERT INTO facturas (codigo_factura, id_cliente, estado, iva_total, total)
             VALUES ($1, $2, 'aprobado', $3, $4)
             RETURNING id_factura`,
            [codigoFactura, clienteId, parseFloat(ivaTotal), parseFloat(total)]
        );
        const idFactura = facResult.rows[0].id_factura;

        // 2. Insertar detalles de productos
        for (const item of items) {
            await client.query(
                `INSERT INTO factura_detalles
                 (id_factura, codigo_producto, cantidad, precio_unitario, iva, cantidad_iva, subtotal, total_producto)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    idFactura,
                    item.codigo,
                    item.cantidad,
                    parseFloat(item.precio),
                    parseFloat(item.iva || 0),
                    parseFloat(item.cantIva || 0),
                    parseFloat(item.subtotal),
                    parseFloat(item.total),
                ]
            );
        }

        // 3. Insertar desglose de pagos
        for (const pago of pagos) {
            await client.query(
                `INSERT INTO factura_pagos (id_factura, id_metodo, monto, referencia)
                 VALUES ($1, $2, $3, $4)`,
                [
                    idFactura,
                    pago.idMetodo,
                    parseFloat(pago.monto),
                    pago.referencia || null,
                ]
            );
        }

        // 4. Actualizar última_compra del cliente
        await client.query(
            `UPDATE clientes SET ultima_compra=$1 WHERE id_cliente=$2`,
            [new Date().toISOString().split('T')[0], clienteId]
        );

        await client.query('COMMIT');
        return res.status(201).json({ ok: true, id: idFactura, codigo: codigoFactura });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una factura con ese código.' });
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Método de pago inválido.' });
        }
        console.error('[facturasController.create]', err);
        return res.status(500).json({ error: 'Error al crear la factura.' });
    } finally {
        client.release();
    }
}

/** PUT /api/facturas/:id/anular — Anular una factura */
async function anular(req, res) {
    const { id } = req.params;
    try {
        const { rowCount } = await pool.query(
            `UPDATE facturas SET estado='anulado'
             WHERE (codigo_factura=$1 OR id_factura::text=$1) AND estado='aprobado'`,
            [id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Factura no encontrada o ya anulada.' });
        }
        return res.json({ ok: true });
    } catch (err) {
        console.error('[facturasController.anular]', err);
        return res.status(500).json({ error: 'Error al anular la factura.' });
    }
}

/** GET /api/facturas/ultimo-codigo — Obtener el último número de factura */
async function ultimoCodigo(req, res) {
    try {
        const { rows } = await pool.query(
            `SELECT codigo_factura FROM facturas ORDER BY id_factura DESC LIMIT 1`
        );
        if (rows.length === 0) {
            return res.json({ codigo: 'FAC-000001' });
        }
        // Incrementar el último número
        const last = rows[0].codigo_factura;
        const match = last.match(/(\d+)$/);
        if (match) {
            const next = parseInt(match[1]) + 1;
            const nuevo = last.replace(/\d+$/, String(next).padStart(match[1].length, '0'));
            return res.json({ codigo: nuevo });
        }
        return res.json({ codigo: 'FAC-000001' });
    } catch (err) {
        console.error('[facturasController.ultimoCodigo]', err);
        return res.status(500).json({ error: 'Error al generar código.' });
    }
}

module.exports = { getAll, getById, create, anular, ultimoCodigo };
