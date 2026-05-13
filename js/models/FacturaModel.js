/**
 * FacturaModel.js — Modelo de Facturas
 * Responsabilidad única: leer/filtrar datos de facturas desde data/facturas.json
 * y datos demo desde data/facturas_demo.json.
 */
const FacturaModel = (function () {
    'use strict';
    let _cache     = null;
    let _demoCache = null;

    async function getAll() {
        if (_cache) return _cache;
        try {
            const r = await fetch('data/facturas.json');
            if (!r.ok) throw new Error('HTTP ' + r.status);
            _cache = await r.json();
            return _cache;
        } catch (e) {
            console.error('FacturaModel.getAll():', e);
            return [];
        }
    }

    /** Devuelve los datos demo de una factura por su código (ej. 'FAC-000001') */
    async function getDemo(codigo) {
        if (!_demoCache) {
            try {
                const r = await fetch('data/facturas_demo.json');
                if (!r.ok) throw new Error('HTTP ' + r.status);
                _demoCache = await r.json();
            } catch (e) {
                console.error('FacturaModel.getDemo():', e);
                return null;
            }
        }
        return _demoCache[codigo] || null;
    }

    /** Filtra facturas según criterios de búsqueda */
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

    function clearCache() { _cache = null; _demoCache = null; }

    return { getAll, getDemo, filter, clearCache };
})();
