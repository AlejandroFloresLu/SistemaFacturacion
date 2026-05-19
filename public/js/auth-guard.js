/**
 * auth-guard.js
 * Se ejecuta INMEDIATAMENTE al cargar (antes del DOM).
 * Si no existe sesión activa → redirige al login.
 */
(function () {
    'use strict';
    if (!sessionStorage.getItem('factu_token')) {
        // Redirige sin agregar historial (replace) para que el botón "Atrás" no regrese
        window.location.replace('login.html');
    }
})();
