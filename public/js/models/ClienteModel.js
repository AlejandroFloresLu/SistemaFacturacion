/**
 * ClienteModel.js — Modelo de Clientes
 * Conecta con la API REST /api/clientes (PostgreSQL).
 */
const ClienteModel = (function () {
    'use strict';
    const BASE = `${API_URL}/api/clientes`;
    let _cache = null;

    async function getAll() {
        if (_cache) return _cache;
        const r = await fetch(BASE);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        _cache = await r.json();
        return _cache;
    }

    async function findByRuc(ruc) {
        const r = await fetch(`${BASE}/buscar?ruc=${encodeURIComponent(ruc)}`);
        if (r.status === 404) return null;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
    }

    async function create(data) {
        // data: { ruc, nombre, apellido, tel, email }
        const r = await fetch(BASE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data),
        });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al crear cliente');
        clearCache();
        return body;
    }

    async function update(id, data) {
        // data: { nombre, apellido, tel, email }
        const r = await fetch(`${BASE}/${id}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data),
        });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al editar cliente');
        clearCache();
        return body;
    }

    async function remove(id) {
        const r = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || 'Error al eliminar cliente');
        clearCache();
        return body;
    }

    function clearCache() { _cache = null; }

    return { getAll, findByRuc, create, update, remove, clearCache };
})();
