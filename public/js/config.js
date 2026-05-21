/** URL base del backend Render (sin /api al final) */
var API_URL = 'https://sistemafacturacion.onrender.com';

/**
 * Retorna los headers HTTP con el token JWT para peticiones autenticadas.
 * Uso: fetch(url, { headers: authHeaders() })
 *      fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) })
 */
function authHeaders(extraHeaders) {
    var token = sessionStorage.getItem('factu_token') || '';
    var base = {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token,
    };
    return Object.assign(base, extraHeaders || {});
}
