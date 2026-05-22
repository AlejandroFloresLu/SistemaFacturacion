/**
 * config.js — Configuración global del frontend
 *
 * API_URL se resuelve automáticamente según el entorno:
 *  - localhost / 127.0.0.1  →  backend local (sin latencia de cold-start)
 *  - cualquier otro host     →  Render (producción)
 */

var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? window.location.protocol + '//' + window.location.hostname + ':3000'
    : 'https://sistemafacturacion.onrender.com';

/**
 * Retorna los headers con el token JWT para peticiones autenticadas.
 * Uso: fetch(url, { headers: authHeaders() })
 *      fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) })
 */
function authHeaders(extraHeaders) {
    var token = sessionStorage.getItem('factu_token') || '';
    return Object.assign(
        { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        extraHeaders || {}
    );
}
