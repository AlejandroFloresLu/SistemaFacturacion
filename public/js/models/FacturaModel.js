/**
 * FacturaModel.js — Modelo de Facturas
 * Conecta con la API REST /api/facturas (PostgreSQL).
 * Todas las peticiones incluyen el header Authorization: Bearer <token>.
 */
const FacturaModel = (function () {
    'use strict';
    const BASE = `${API_URL}/api/facturas`;
    let _cache = null;

    async function getAll() {
        if (_cache) return _cache;
        const r = await fetch(BASE, { headers: authHeaders() });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        _cache = await r.json();
        return _cache;
    }

    async function getById(id) {
        const r = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
            headers: authHeaders(),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
    }

    /** Filtra facturas localmente (útil para la lista) */
    async function filter({ desde = '', hasta = '', estado = '', texto = '' } = {}) {
        const all = await getAll();
        return all.filter(f => {
            const okEstado = !estado || f.estado === estado;
            const okTexto  = !texto  ||
                f.id.toLowerCase().includes(texto) ||
                f.cliente.toLowerCase().includes(texto);
            const okDesde  = !desde  || f.fecha >= desde;
            const okHasta  = !hasta  || f.fecha <= hasta;
            return okEstado && okTexto && okDesde && okHasta;
        });
    }

    /**
     * Crear factura en la BD.
     * payload: { clienteId, codigoFactura, items, ivaTotal, total }
     */
    async function create(payload) {
        const r = await fetch(BASE, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify(payload),
        });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al crear la factura');
        clearCache();
        return body;
    }

    /** Anular factura por id (código o numérico) */
    async function anular(id) {
        const r = await fetch(`${BASE}/${encodeURIComponent(id)}/anular`, {
            method:  'PUT',
            headers: authHeaders(),
        });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al anular la factura');
        clearCache();
        return body;
    }

    /** Obtener el siguiente código de factura disponible */
    async function siguienteCodigo() {
        const r = await fetch(`${BASE}/ultimo-codigo`, { headers: authHeaders() });
        if (!r.ok) return 'FAC-000001';
        const data = await r.json();
        return data.codigo || 'FAC-000001';
    }

    function clearCache() { _cache = null; }

    return { getAll, getById, filter, create, anular, siguienteCodigo, clearCache };
})();
