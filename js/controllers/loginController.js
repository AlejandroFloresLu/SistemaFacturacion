/**
 * loginController.js — Controlador de Autenticación
 * Maneja la lógica del formulario de login y guarda el token de sesión.
 */
lucide.createIcons();

function validarLogin(event) {
    event.preventDefault();

    const userField = document.getElementById('usuario');
    const passField = document.getElementById('password');
    const errorDiv  = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // Resetear estados
    errorDiv.classList.add('hidden');
    userField.classList.remove('error-border');
    passField.classList.remove('error-border');

    const user = userField.value.trim();
    const pass = passField.value.trim();

    if (!user) { mostrarError('El campo usuario no puede estar vacío', userField); return; }
    if (!pass) { mostrarError('Debes ingresar una contraseña', passField); return; }

    // Validar credenciales (en producción esto va al backend)
    if (user === 'admin' && pass === '1234') {
        sessionStorage.setItem('factu_token',    'active');
        sessionStorage.setItem('factu_user',     'Alejandro Flores');
        sessionStorage.setItem('factu_initials', 'AF');
        window.location.href = 'index.html';
    } else {
        mostrarError('Usuario o contraseña incorrectos. Verifica tus datos.', null);
        userField.classList.add('error-border');
        passField.classList.add('error-border');
    }
}

function mostrarError(mensaje, campo) {
    const errorDiv  = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.innerText = mensaje;
    errorDiv.classList.remove('hidden');
    if (campo) { campo.classList.add('error-border'); campo.focus(); }
}
