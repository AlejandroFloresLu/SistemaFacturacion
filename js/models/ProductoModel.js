/**
 * ProductoModel.js — Modelo de Productos
 * Responsabilidad única: leer/escribir datos de productos desde data/productos.json.
 */
const ProductoModel = (function () {
    'use strict';
    let _cache = null;

    async function getAll() {
        if (_cache) return _cache;
        try {
            const r = await fetch('data/productos.json');
            if (!r.ok) throw new Error('HTTP ' + r.status);
            _cache = await r.json();
            return _cache;
        } catch (e) {
            console.error('ProductoModel.getAll():', e);
            return [];
        }
    }

    async function findById(id) {
        const all = await getAll();
        return all.find(p => p.id === id) || null;
    }

    async function findByTerm(term) {
        const all = await getAll();
        const t = term.toLowerCase();
        return all.find(p =>
            p.desc.toLowerCase().includes(t) ||
            p.id.toLowerCase() === t
        ) || null;
    }

    function clearCache() { _cache = null; }

    return { getAll, findById, findByTerm, clearCache };
})();
