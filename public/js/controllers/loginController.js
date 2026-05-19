/**
 * loginController.js — Controlador de Autenticación
 * Valida credenciales contra el backend (POST /api/auth/login).
 */
lucide.createIcons();

async function validarLogin(event) {
    event.preventDefault();

    const userField  = document.getElementById('usuario');
    const passField  = document.getElementById('password');
    const errorDiv   = document.getElementById('errorMessage');
    const errorText  = document.getElementById('errorText');
    const btnSubmit  = event.target.querySelector('[type="submit"]');

    // Resetear estados
    errorDiv.classList.add('hidden');
    userField.classList.remove('error-border');
    passField.classList.remove('error-border');

    const user = userField.value.trim();
    const pass = passField.value.trim();

    if (!user) { mostrarError('El campo usuario no puede estar vacío', userField); return; }
    if (!pass) { mostrarError('Debes ingresar una contraseña', passField); return; }

    // Deshabilitar botón durante la petición
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';

    try {
        const response = await fetch('/api/auth/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ username: user, password: pass }),
        });

        const data = await response.json();

        if (response.ok && data.ok) {
            // Guardar datos de sesión
            sessionStorage.setItem('factu_token',    'active');
            sessionStorage.setItem('factu_user',     data.user.username);
            sessionStorage.setItem('factu_initials', data.user.username.substring(0, 2).toUpperCase());
            sessionStorage.setItem('factu_rol',      data.user.rol);
            window.location.href = 'index.html';
        } else {
            mostrarError(data.message || 'Usuario o contraseña incorrectos.', null);
            userField.classList.add('error-border');
            passField.classList.add('error-border');
        }
    } catch (err) {
        mostrarError('No se pudo conectar con el servidor. ¿Está encendido?', null);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Ingresar al sistema <i data-lucide="arrow-right" size="20"></i>';
        lucide.createIcons();
    }
}

function mostrarError(mensaje, campo) {
    const errorDiv  = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.innerText = mensaje;
    errorDiv.classList.remove('hidden');
    if (campo) { campo.classList.add('error-border'); campo.focus(); }
}
