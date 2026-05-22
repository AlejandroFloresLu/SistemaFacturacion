/**
 * test-factura-flow.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Script de validación end-to-end para el flujo de emisión de facturas.
 * Simula exactamente el payload que envía factura.html y verifica en BD
 * que los registros de facturas, factura_detalles y factura_pagos son correctos.
 *
 * Uso: node test-factura-flow.js
 * Requisito: el servidor debe estar corriendo (npm run dev)
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const pool = require('./server/config/db');

const BASE_URL  = `http://localhost:${process.env.PORT || 3000}`;
const CODIGO_FACTURA = `TEST-${Date.now()}`;   // código único por ejecución

// ── Helpers de consola ───────────────────────────────────────────────────────
const OK   = (msg) => console.log(`  ✅  ${msg}`);
const FAIL = (msg) => { console.error(`  ❌  ${msg}`); };
const INFO = (msg) => console.log(`  ℹ️   ${msg}`);

let passed = 0;
let failed = 0;

function assert(condition, description) {
    if (condition) {
        OK(description);
        passed++;
    } else {
        FAIL(description);
        failed++;
    }
}

// ── IDs de datos creados durante el test (para limpieza final) ───────────────
let testClienteId  = null;
let testProductoId = null;
let testFacturaId  = null;

// ─────────────────────────────────────────────────────────────────────────────
// SETUP — Crear datos de prueba directamente en BD
// ─────────────────────────────────────────────────────────────────────────────
async function setup() {
    console.log('\n📦  SETUP — Creando datos de prueba en BD...');

    // Cliente de prueba
    const cliRes = await pool.query(
        `INSERT INTO clientes (ruc_o_cedula, nombres, apellidos, telefono, email, ultima_compra, estado)
         VALUES ($1, $2, $3, $4, $5, 'Nuevo', true)
         RETURNING id_cliente`,
        ['9999999999', 'Test', 'Automatizado', '0999999999', 'test@factu.test']
    );
    testClienteId = cliRes.rows[0].id_cliente;
    INFO(`Cliente de prueba creado → id_cliente = ${testClienteId}`);

    // Producto de prueba
    const prodRes = await pool.query(
        `INSERT INTO productos (codigo, descripcion, precio, estado)
         VALUES ($1, $2, $3, true)
         RETURNING id_producto`,
        ['TEST-PROD-001', 'Producto de prueba automatizada', 25.00]
    );
    testProductoId = prodRes.rows[0].id_producto;
    INFO(`Producto de prueba creado → id_producto = ${testProductoId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1 — Simular el payload exacto del frontend y hacer POST /api/facturas
// ─────────────────────────────────────────────────────────────────────────────
async function paso1_emitirFactura() {
    console.log('\n🌐  PASO 1 — Simulando POST /api/facturas (payload de factura.html)...');

    // Cálculos idénticos a los que hace factura.ui.js
    const cantidad       = 3;
    const precioUnitario = 25.00;
    const ivaPct         = 12;                                       // 12 %
    const subtotal       = cantidad * precioUnitario;                // 75.00
    const cantIva        = parseFloat((subtotal * ivaPct / 100).toFixed(2)); // 9.00
    const totalProducto  = subtotal + cantIva;                       // 84.00
    const ivaTotal       = cantIva;                                  // 9.00
    const totalFactura   = totalProducto;                            // 84.00

    // Pago mixto: 50 efectivo + 34 transferencia = 84.00 ✓
    const payload = {
        clienteId:      testClienteId,
        codigoFactura:  CODIGO_FACTURA,
        items: [
            {
                codigo:    'TEST-PROD-001',
                cantidad:  cantidad,
                precio:    precioUnitario,
                iva:       ivaPct,
                cantIva:   cantIva,
                subtotal:  subtotal,
                total:     totalProducto,
            }
        ],
        ivaTotal:  ivaTotal,
        total:     totalFactura,
        pagos: [
            { idMetodo: 1, monto: 50.00 },                          // Efectivo
            { idMetodo: 4, monto: 34.00, referencia: 'TXN-TEST-99' } // Transferencia
        ]
    };

    INFO(`Payload → codigo: ${CODIGO_FACTURA}, total: ${totalFactura}, pagos: [50 Efectivo + 34 Transferencia]`);

    const response = await fetch(`${BASE_URL}/api/facturas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
    });

    const body = await response.json();

    assert(response.status === 201,           `HTTP 201 Created (recibido: ${response.status})`);
    assert(body.ok === true,                  `Respuesta body.ok === true`);
    assert(typeof body.id === 'number',       `Respuesta incluye id numérico de factura (id=${body.id})`);
    assert(body.codigo === CODIGO_FACTURA,    `Respuesta body.codigo === "${CODIGO_FACTURA}"`);

    testFacturaId = body.id;
    INFO(`Factura creada con id_factura = ${testFacturaId}`);

    return { subtotal, cantIva, totalProducto, ivaTotal, totalFactura, cantidad, precioUnitario, ivaPct };
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2 — Validar cabecera en tabla `facturas`
// ─────────────────────────────────────────────────────────────────────────────
async function paso2_validarCabecera({ ivaTotal, totalFactura }) {
    console.log('\n🗄️   PASO 2 — Verificando tabla `facturas` en PostgreSQL...');

    const { rows } = await pool.query(
        `SELECT id_factura, codigo_factura, id_cliente, estado, iva_total, total
         FROM facturas WHERE id_factura = $1`,
        [testFacturaId]
    );

    assert(rows.length === 1,
        `Registro encontrado en tabla facturas (id=${testFacturaId})`);

    if (rows.length === 0) return;   // no seguir si no existe

    const f = rows[0];
    assert(f.codigo_factura === CODIGO_FACTURA,
        `codigo_factura coincide → "${f.codigo_factura}"`);
    assert(parseInt(f.id_cliente) === testClienteId,
        `id_cliente coincide → ${f.id_cliente} === ${testClienteId}`);
    assert(f.estado === 'aprobado',
        `estado === 'aprobado'`);
    assert(parseFloat(f.iva_total) === ivaTotal,
        `iva_total = ${f.iva_total} (esperado: ${ivaTotal})`);
    assert(parseFloat(f.total) === totalFactura,
        `total = ${f.total} (esperado: ${totalFactura})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3 — Validar detalles en tabla `factura_detalles`
// ─────────────────────────────────────────────────────────────────────────────
async function paso3_validarDetalles({ cantidad, precioUnitario, cantIva, subtotal, totalProducto }) {
    console.log('\n🗄️   PASO 3 — Verificando tabla `factura_detalles` en PostgreSQL...');

    const { rows } = await pool.query(
        `SELECT codigo_producto, cantidad, precio_unitario, iva, cantidad_iva, subtotal, total_producto
         FROM factura_detalles WHERE id_factura = $1`,
        [testFacturaId]
    );

    assert(rows.length === 1,
        `Exactamente 1 detalle insertado en factura_detalles`);

    if (rows.length === 0) return;

    const d = rows[0];
    assert(d.codigo_producto === 'TEST-PROD-001',
        `codigo_producto === 'TEST-PROD-001'`);
    assert(parseInt(d.cantidad) === cantidad,
        `cantidad = ${d.cantidad} (esperado: ${cantidad})`);
    assert(parseFloat(d.precio_unitario) === precioUnitario,
        `precio_unitario = ${d.precio_unitario} (esperado: ${precioUnitario})`);
    assert(parseFloat(d.cantidad_iva) === cantIva,
        `cantidad_iva = ${d.cantidad_iva} (esperado: ${cantIva})`);
    assert(parseFloat(d.subtotal) === subtotal,
        `subtotal = ${d.subtotal} (esperado: ${subtotal})`);
    assert(parseFloat(d.total_producto) === totalProducto,
        `total_producto = ${d.total_producto} (esperado: ${totalProducto})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 4 — Validar pagos en tabla `factura_pagos`
// ─────────────────────────────────────────────────────────────────────────────
async function paso4_validarPagos({ totalFactura }) {
    console.log('\n🗄️   PASO 4 — Verificando tabla `factura_pagos` en PostgreSQL...');

    const { rows } = await pool.query(
        `SELECT fp.id_metodo, fp.monto, fp.referencia, mp.nombre
         FROM factura_pagos fp
         JOIN metodos_pago mp ON fp.id_metodo = mp.id_metodo
         WHERE fp.id_factura = $1
         ORDER BY fp.id_pago`,
        [testFacturaId]
    );

    assert(rows.length === 2,
        `Exactamente 2 registros en factura_pagos`);

    if (rows.length < 2) return;

    assert(rows[0].nombre === 'Efectivo' && parseFloat(rows[0].monto) === 50.00,
        `Pago 1: Efectivo $50.00`);
    assert(rows[1].nombre === 'Transferencia Bancaria' && parseFloat(rows[1].monto) === 34.00,
        `Pago 2: Transferencia Bancaria $34.00`);
    assert(rows[1].referencia === 'TXN-TEST-99',
        `Referencia de transferencia guardada → '${rows[1].referencia}'`);

    const sumaPagos = rows.reduce((acc, r) => acc + parseFloat(r.monto), 0);
    assert(Math.abs(sumaPagos - totalFactura) <= 0.01,
        `Suma de pagos (${sumaPagos}) === total de factura (${totalFactura})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 5 — Validar GET /api/facturas/:id incluye el desglose de pagos
// ─────────────────────────────────────────────────────────────────────────────
async function paso5_validarGetById() {
    console.log('\n🌐  PASO 5 — Verificando GET /api/facturas/:id incluye pagos...');

    const response = await fetch(`${BASE_URL}/api/facturas/${CODIGO_FACTURA}`);
    const body = await response.json();

    assert(response.status === 200,          `HTTP 200 OK`);
    assert(Array.isArray(body.detalles),     `body.detalles es un arreglo`);
    assert(body.detalles.length === 1,       `body.detalles tiene 1 elemento`);
    assert(Array.isArray(body.pagos),        `body.pagos es un arreglo`);
    assert(body.pagos.length === 2,          `body.pagos tiene 2 elementos`);
    assert(body.pagos[0].metodo === 'Efectivo',
        `body.pagos[0].metodo === 'Efectivo'`);
    assert(body.pagos[1].metodo === 'Transferencia Bancaria',
        `body.pagos[1].metodo === 'Transferencia Bancaria'`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 6 — Validar rechazo por suma de pagos incorrecta
// ─────────────────────────────────────────────────────────────────────────────
async function paso6_validarReglaNegocio() {
    console.log('\n🚦  PASO 6 — Verificando regla de negocio (suma pagos ≠ total → 400)...');

    const payload = {
        clienteId:      testClienteId,
        codigoFactura:  `TEST-REJECT-${Date.now()}`,
        items: [{ codigo: 'TEST-PROD-001', cantidad: 1, precio: 25.00, iva: 12, cantIva: 3.00, subtotal: 25.00, total: 28.00 }],
        ivaTotal: 3.00,
        total:    28.00,
        pagos: [{ idMetodo: 1, monto: 10.00 }]   // ← deliberadamente incorrecto: 10 ≠ 28
    };

    const response = await fetch(`${BASE_URL}/api/facturas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
    });
    const body = await response.json();

    assert(response.status === 400,
        `HTTP 400 cuando suma de pagos no coincide con total`);
    assert(typeof body.error === 'string' && body.error.includes('no coincide'),
        `Mensaje de error descriptivo devuelto → "${body.error}"`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEARDOWN — Eliminar datos de prueba de la BD
// ─────────────────────────────────────────────────────────────────────────────
async function teardown() {
    console.log('\n🧹  TEARDOWN — Eliminando datos de prueba...');
    try {
        if (testFacturaId) {
            // factura_detalles y factura_pagos se borran en cascada
            await pool.query('DELETE FROM facturas WHERE id_factura = $1', [testFacturaId]);
            INFO(`Factura ${testFacturaId} eliminada (detalles y pagos en cascada)`);
        }
        if (testProductoId) {
            await pool.query('DELETE FROM productos WHERE id_producto = $1', [testProductoId]);
            INFO(`Producto de prueba eliminado`);
        }
        if (testClienteId) {
            await pool.query('DELETE FROM clientes WHERE id_cliente = $1', [testClienteId]);
            INFO(`Cliente de prueba eliminado`);
        }
    } catch (err) {
        console.warn('  ⚠️  Error en teardown:', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('══════════════════════════════════════════════════════════');
    console.log('   FACTU — Test de Flujo de Emisión de Factura            ');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Servidor:  ${BASE_URL}`);
    console.log(`  Código:    ${CODIGO_FACTURA}`);

    // Verificar que el servidor esté vivo antes de continuar
    try {
        const health = await fetch(`${BASE_URL}/api/health`);
        if (!health.ok) throw new Error('health check falló');
        INFO('Servidor respondiendo en /api/health ✓');
    } catch {
        console.error('\n  ❌  No se puede conectar al servidor en ' + BASE_URL);
        console.error('  ➜  Asegúrate de tener corriendo: npm run dev\n');
        process.exit(1);
    }

    // Verificar que el servidor tenga el código nuevo (soporte de pagos)
    // Intentamos un POST que requiere pagos[] — si el servidor es viejo, devuelve 201 sin pagos
    // Lo detectamos enviando un payload SIN pagos y viendo si responde 400
    try {
        const probe = await fetch(`${BASE_URL}/api/facturas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clienteId: 1, codigoFactura: 'PROBE', items: [{}], total: 1 }),
        });
        const probeBody = await probe.json();
        const tieneValidacionPagos = probe.status === 400 &&
            (probeBody.error?.includes('método de pago') || probeBody.error?.includes('incompletos'));
        if (!tieneValidacionPagos) {
            console.error('\n  ❌  El servidor NO tiene el código actualizado de pagos.');
            console.error('  ➜  Reinicia el servidor: Ctrl+C en la terminal de npm run dev, luego npm run dev');
            console.error('  ➜  Después vuelve a ejecutar: node test-factura-flow.js\n');
            await pool.end();
            process.exit(1);
        }
        INFO('Servidor tiene soporte de pagos (código actualizado) ✓');
    } catch { /* si falla por otra razón, continuar */ }

    try {
        await setup();

        const calculos = await paso1_emitirFactura();
        await paso2_validarCabecera(calculos);
        await paso3_validarDetalles(calculos);
        await paso4_validarPagos(calculos);
        await paso5_validarGetById();
        await paso6_validarReglaNegocio();

    } catch (err) {
        console.error('\n  💥  Error inesperado durante las pruebas:', err.message);
        failed++;
    } finally {
        await teardown();
        await pool.end();
    }

    // ── Resumen final ────────────────────────────────────────────────────────
    const total = passed + failed;
    console.log('');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Resultado: ${passed}/${total} pruebas pasaron`);
    if (failed === 0) {
        console.log('  🎉  TODAS LAS PRUEBAS PASARON');
    } else {
        console.log(`  ⚠️   ${failed} prueba(s) fallaron — revisa los ❌ arriba`);
    }
    console.log('══════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
}

main();
