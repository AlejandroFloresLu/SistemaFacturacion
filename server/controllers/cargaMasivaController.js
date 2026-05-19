/**
 * cargaMasivaController.js (backend) — Importación masiva con validación previa
 *
 * Regla de negocio estricta:
 *   1. Parsear todo el CSV
 *   2. Validar CADA fila — acumular errores con número de fila exacto
 *   3. Si hay al menos 1 error → devolver 422 con el array de errores (NO INSERT)
 *   4. Solo si 0 errores → ejecutar bulk INSERT en transacción atómica
 */
'use strict';
const pool   = require('../config/db');
const { parse } = require('csv-parse/sync');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parsea CSV de manera segura; lanza error legible si malformado */
function parsearCSV(buffer) {
    return parse(buffer.toString('utf-8'), {
        columns:           true,
        skip_empty_lines:  true,
        trim:              true,
        bom:               true,   // soporta BOM UTF-8 del plantilla de Excel
        relax_column_count: false,
    });
}

/** Valida cédula ecuatoriana de 10 dígitos */
function validarCedula(cedula) {
    if (!/^\d{10}$/.test(cedula)) return false;
    const reg = parseInt(cedula.substring(0, 2), 10);
    if (reg < 1 || reg > 24) return false;
    const tercer = parseInt(cedula[2], 10);
    if (tercer > 5) return false;
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let v = parseInt(cedula[i], 10);
        if (i % 2 === 0) { v *= 2; if (v > 9) v -= 9; }
        suma += v;
    }
    const decena = Math.ceil(suma / 10) * 10;
    let res = decena - suma;
    if (res === 10) res = 0;
    return res === parseInt(cedula[9], 10);
}

/** Valida RUC ecuatoriano (13 dígitos, 3er digito < 6, termina en 001) */
function validarRUC(ruc) {
    if (!/^\d{13}$/.test(ruc)) return false;
    if (!ruc.endsWith('001')) return false;
    return validarCedula(ruc.substring(0, 10));
}

/** Valida cédula (10 dígitos) o RUC (13 dígitos) o consumidor final */
function validarRucOCedula(val) {
    if (!val) return false;
    if (val === '9999999999') return true;  // consumidor final
    if (val.length === 10) return validarCedula(val);
    if (val.length === 13) return validarRUC(val);
    return false;
}

// ── POST /api/carga/clientes ──────────────────────────────────────────────────
async function uploadClientes(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    let records;
    try {
        records = parsearCSV(req.file.buffer);
    } catch {
        return res.status(422).json({ error: 'El archivo CSV tiene formato inválido o columnas incorrectas.' });
    }

    if (records.length === 0) {
        return res.status(422).json({ error: 'El archivo no contiene filas de datos (solo cabeceras o vacío).' });
    }

    // ── FASE 1: Validación completa ───────────────────────────────────────────
    const errores = [];

    records.forEach((row, idx) => {
        const fila     = idx + 2;  // fila 1 = cabecera, datos desde fila 2
        const nombre   = (row['Nombre']    || '').trim();
        const apellido = (row['Apellido']  || '').trim();
        const ruc      = (row['RUC_Cedula']|| '').trim();
        const email    = (row['Email']     || '').trim();

        if (!nombre)   errores.push(`Fila ${fila}: El campo "Nombre" es obligatorio.`);
        if (!apellido) errores.push(`Fila ${fila}: El campo "Apellido" es obligatorio.`);
        if (!ruc)      errores.push(`Fila ${fila}: El campo "RUC_Cedula" es obligatorio.`);
        else if (!validarRucOCedula(ruc)) {
            errores.push(`Fila ${fila}: RUC/Cédula "${ruc}" inválido (debe ser 10 dígitos de cédula válida o 13 de RUC).`);
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errores.push(`Fila ${fila}: El email "${email}" no tiene un formato válido.`);
        }
    });

    if (errores.length > 0) {
        return res.status(422).json({ ok: false, errores });
    }

    // ── FASE 2: INSERT atómico ────────────────────────────────────────────────
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let insertados = 0;

        for (const row of records) {
            const nombre   = row['Nombre'].trim();
            const apellido = row['Apellido'].trim();
            const ruc      = row['RUC_Cedula'].trim();
            const tel      = (row['Telefono'] || '').trim() || null;
            const email    = (row['Email']    || '').trim() || null;

            const { rowCount } = await client.query(
                `INSERT INTO clientes (ruc_o_cedula, nombres, apellidos, telefono, email, estado)
                 VALUES ($1, $2, $3, $4, $5, true)
                 ON CONFLICT (ruc_o_cedula) DO NOTHING`,
                [ruc, nombre, apellido, tel, email]
            );
            insertados += rowCount;
        }

        await client.query('COMMIT');
        return res.json({ ok: true, total: records.length, insertados });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[cargaMasiva.uploadClientes]', err);
        return res.status(500).json({ error: 'Error durante el INSERT masivo: ' + err.message });
    } finally {
        client.release();
    }
}

// ── POST /api/carga/productos ─────────────────────────────────────────────────
async function uploadProductos(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    let records;
    try {
        records = parsearCSV(req.file.buffer);
    } catch {
        return res.status(422).json({ error: 'El archivo CSV tiene formato inválido o columnas incorrectas.' });
    }

    if (records.length === 0) {
        return res.status(422).json({ error: 'El archivo no contiene filas de datos (solo cabeceras o vacío).' });
    }

    // ── FASE 1: Validación completa ───────────────────────────────────────────
    const errores = [];
    const codigosVisto = new Set();

    records.forEach((row, idx) => {
        const fila   = idx + 2;
        const codigo = (row['Codigo']      || '').trim().toUpperCase();
        const desc   = (row['Descripcion'] || '').trim();
        const precio = parseFloat((row['Precio'] || '').replace(',', '.'));

        if (!codigo) {
            errores.push(`Fila ${fila}: El campo "Codigo" es obligatorio.`);
        } else if (!/^[A-Z0-9_\-]+$/i.test(codigo)) {
            errores.push(`Fila ${fila}: El código "${codigo}" contiene caracteres inválidos.`);
        } else if (codigosVisto.has(codigo)) {
            errores.push(`Fila ${fila}: El código "${codigo}" está duplicado dentro del mismo archivo.`);
        } else {
            codigosVisto.add(codigo);
        }

        if (!desc) errores.push(`Fila ${fila}: El campo "Descripcion" es obligatorio.`);

        if (!row['Precio'] || row['Precio'].trim() === '') {
            errores.push(`Fila ${fila}: El campo "Precio" es obligatorio.`);
        } else if (isNaN(precio) || precio <= 0) {
            errores.push(`Fila ${fila}: El precio "${row['Precio']}" debe ser un número positivo.`);
        }
    });

    if (errores.length > 0) {
        return res.status(422).json({ ok: false, errores });
    }

    // ── FASE 2: INSERT atómico ────────────────────────────────────────────────
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let insertados = 0;

        for (const row of records) {
            const codigo = row['Codigo'].trim().toUpperCase();
            const desc   = row['Descripcion'].trim();
            const precio = parseFloat(row['Precio'].replace(',', '.'));

            const { rowCount } = await client.query(
                `INSERT INTO productos (codigo, descripcion, precio, estado)
                 VALUES ($1, $2, $3, true)
                 ON CONFLICT (codigo) DO NOTHING`,
                [codigo, desc, precio]
            );
            insertados += rowCount;
        }

        await client.query('COMMIT');
        return res.json({ ok: true, total: records.length, insertados });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[cargaMasiva.uploadProductos]', err);
        return res.status(500).json({ error: 'Error durante el INSERT masivo: ' + err.message });
    } finally {
        client.release();
    }
}

// ── POST /api/carga/facturas ──────────────────────────────────────────────────
/**
 * Columnas: CodigoFactura, RUC_Cliente, CodigoProducto, Cantidad, Precio
 * Cada fila es UN detalle de factura.
 * Facturas con el mismo CodigoFactura se agrupan en una sola cabecera.
 */
async function uploadFacturas(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    let records;
    try {
        records = parsearCSV(req.file.buffer);
    } catch {
        return res.status(422).json({ error: 'El archivo CSV tiene formato inválido o columnas incorrectas.' });
    }

    if (records.length === 0) {
        return res.status(422).json({ error: 'El archivo no contiene filas de datos.' });
    }

    // ── FASE 1: Validación de formato ─────────────────────────────────────────
    const errores = [];

    records.forEach((row, idx) => {
        const fila     = idx + 2;
        const codigo   = (row['CodigoFactura']  || '').trim();
        const ruc      = (row['RUC_Cliente']    || '').trim();
        const producto = (row['CodigoProducto'] || '').trim();
        const cantidad = parseInt(row['Cantidad'] || '', 10);
        const precio   = row['Precio'] ? parseFloat((row['Precio'] || '').replace(',', '.')) : null;

        if (!codigo)   errores.push(`Fila ${fila}: "CodigoFactura" es obligatorio.`);
        if (!ruc)      errores.push(`Fila ${fila}: "RUC_Cliente" es obligatorio.`);
        else if (!validarRucOCedula(ruc)) {
            errores.push(`Fila ${fila}: RUC "${ruc}" inválido.`);
        }
        if (!producto) errores.push(`Fila ${fila}: "CodigoProducto" es obligatorio.`);
        if (!row['Cantidad'] || isNaN(cantidad) || cantidad <= 0) {
            errores.push(`Fila ${fila}: "Cantidad" debe ser un entero positivo.`);
        }
        if (precio !== null && (isNaN(precio) || precio <= 0)) {
            errores.push(`Fila ${fila}: "Precio" debe ser un número positivo si se especifica.`);
        }
    });

    if (errores.length > 0) {
        return res.status(422).json({ ok: false, errores });
    }

    // ── FASE 2: Verificar existencia de clientes y productos en BD ────────────
    const rucs      = [...new Set(records.map(r => r['RUC_Cliente'].trim()))];
    const productos = [...new Set(records.map(r => r['CodigoProducto'].trim().toUpperCase()))];

    const [clientesRes, productosRes] = await Promise.all([
        pool.query(`SELECT ruc_o_cedula, id_cliente FROM clientes WHERE ruc_o_cedula = ANY($1)`, [rucs]),
        pool.query(`SELECT codigo, precio FROM productos WHERE codigo = ANY($1)`, [productos]),
    ]);

    const clienteMap  = Object.fromEntries(clientesRes.rows.map(r => [r.ruc_o_cedula, r.id_cliente]));
    const productoMap = Object.fromEntries(productosRes.rows.map(r => [r.codigo, parseFloat(r.precio)]));

    rucs.forEach(ruc => {
        if (!clienteMap[ruc]) errores.push(`El cliente con RUC/CI "${ruc}" no existe en la base de datos.`);
    });
    productos.forEach(cod => {
        if (productoMap[cod.toUpperCase()] === undefined) {
            errores.push(`El producto con código "${cod}" no existe en la base de datos.`);
        }
    });

    if (errores.length > 0) {
        return res.status(422).json({ ok: false, errores });
    }

    // ── FASE 3: INSERT atómico ────────────────────────────────────────────────
    const IVA = 0.15;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Agrupar filas por CodigoFactura
        const grupos = {};
        for (const row of records) {
            const cod = row['CodigoFactura'].trim();
            if (!grupos[cod]) grupos[cod] = [];
            grupos[cod].push(row);
        }

        let facturasInsertadas = 0;

        for (const [codigoFactura, filas] of Object.entries(grupos)) {
            const ruc       = filas[0]['RUC_Cliente'].trim();
            const clienteId = clienteMap[ruc];

            // Calcular totales
            let subtotal = 0;
            const detalles = filas.map(row => {
                const codProd  = row['CodigoProducto'].trim().toUpperCase();
                const cantidad = parseInt(row['Cantidad'], 10);
                const precio   = row['Precio']
                    ? parseFloat(row['Precio'].replace(',', '.'))
                    : productoMap[codProd];
                const lineTotal = cantidad * precio;
                subtotal += lineTotal;
                return { codProd, cantidad, precio, lineTotal };
            });
            const ivaTotal = parseFloat((subtotal * IVA).toFixed(2));
            const total    = parseFloat((subtotal + ivaTotal).toFixed(2));

            // Insertar cabecera
            const { rows: [fac] } = await client.query(
                `INSERT INTO facturas (codigo_factura, id_cliente, estado, iva_total, total)
                 VALUES ($1, $2, 'aprobado', $3, $4)
                 ON CONFLICT (codigo_factura) DO NOTHING
                 RETURNING id_factura`,
                [codigoFactura, clienteId, ivaTotal, total]
            );

            if (!fac) continue; // código duplicado → omitir

            // Insertar detalles
            for (const d of detalles) {
                const subtotalLinea = parseFloat(d.lineTotal.toFixed(2));
                const ivaLinea      = parseFloat((d.lineTotal * IVA).toFixed(2));
                const totalLinea    = parseFloat((d.lineTotal * (1 + IVA)).toFixed(2));

                await client.query(
                    `INSERT INTO factura_detalles
                     (id_factura, codigo_producto, cantidad, precio_unitario, iva, cantidad_iva, subtotal, total_producto)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [fac.id_factura, d.codProd, d.cantidad, d.precio,
                     IVA * 100, ivaLinea, subtotalLinea, totalLinea]
                );
            }

            // Insertar pago único (efectivo) como marcador contable de carga masiva
            await client.query(
                `INSERT INTO factura_pagos (id_factura, id_metodo, monto)
                 VALUES ($1, 1, $2)`,
                [fac.id_factura, total]
            );

            facturasInsertadas++;
        }

        await client.query('COMMIT');
        return res.json({
            ok:         true,
            total:      Object.keys(grupos).length,
            insertados: facturasInsertadas,
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[cargaMasiva.uploadFacturas]', err);
        return res.status(500).json({ error: 'Error durante el INSERT masivo: ' + err.message });
    } finally {
        client.release();
    }
}

async function uploadFile(req, res) {
    const entidad = req.body.entidad;
    if (entidad === 'clientes') return uploadClientes(req, res);
    if (entidad === 'productos') return uploadProductos(req, res);
    if (entidad === 'facturas') return uploadFacturas(req, res);
    return res.status(400).json({ error: 'Entidad desconocida o no especificada.' });
}

module.exports = { uploadFile };
