/**
 * ProductoModel.js — Modelo de Productos
 * Conecta con la API REST /api/productos (PostgreSQL).
 */
const ProductoModel = (function () {
    'use strict';
    const BASE = `${API_URL}/api/productos`;
    let _cache = null;

    async function getAll() {
        if (_cache) return _cache;
        const r = await fetch(BASE);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        _cache = await r.json();
        return _cache;
    }

    async function findById(id) {
        const all = await getAll();
        return all.find(p => p.id === id) || null;
    }

    async function findByTerm(term) {
        const r = await fetch(`${BASE}/buscar?term=${encodeURIComponent(term)}`);
        if (!r.ok) return [];
        const data = await r.json();
        // Devuelve el primer resultado (compatible con código existente)
        return Array.isArray(data) ? (data[0] || null) : null;
    }

    async function findAllByTerm(term) {
        const r = await fetch(`${BASE}/buscar?term=${encodeURIComponent(term)}`);
        if (!r.ok) return [];
        return await r.json();
    }

    async function create(data) {
        // data: { codigo, descripcion, precio }
        const r = await fetch(BASE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data),
        });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al crear producto');
        clearCache();
        return body;
    }

    async function update(id, data) {
        // id = codigo, data: { descripcion, precio }
        const r = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data),
        });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al editar producto');
        clearCache();
        return body;
    }

    async function remove(id) {
        const r = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al eliminar producto');
        clearCache();
        return body;
    }

    function clearCache() { _cache = null; }

    return { getAll, findById, findByTerm, findAllByTerm, create, update, remove, clearCache };
})();
