/**
 * ClienteModel.js — Modelo de Clientes
 * Responsabilidad única: leer/escribir datos de clientes desde data/clientes.json.
 * Incluye caché en memoria para evitar fetch repetidos.
 */
const ClienteModel = (function () {
    'use strict';
    let _cache = null;

    async function getAll() {
        if (_cache) return _cache;
        try {
            const r = await fetch('data/clientes.json');
            if (!r.ok) throw new Error('HTTP ' + r.status);
            _cache = await r.json();
            return _cache;
        } catch (e) {
            console.error('ClienteModel.getAll():', e);
            return [];
        }
    }

    async function findByRuc(ruc) {
        const all = await getAll();
        return all.find(c => c.ruc === ruc) || null;
    }

    /** Invalida caché (útil tras crear/editar un cliente) */
    function clearCache() { _cache = null; }

    return { getAll, findByRuc, clearCache };
})();
