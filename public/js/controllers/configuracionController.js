/**
 * configuracionController.js
 * Módulo independiente para la pantalla de Configuración.
 * Guarda las preferencias de diseño y aplica los estilos globales sin tocar la base de datos.
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        
        // 1. Obtener preferencias guardadas en localStorage
        const theme = localStorage.getItem('factu_theme') || 'light';
        const contrast = localStorage.getItem('factu_contrast') || 'normal';
        const font = localStorage.getItem('factu_fontsize') || 'normal';

        // 2. Sincronizar la UI seleccionando los botones correctos
        const themeInput = document.querySelector(`input[name="confTheme"][value="${theme}"]`);
        if (themeInput) themeInput.checked = true;

        const contrastInput = document.querySelector(`input[name="confContrast"][value="${contrast}"]`);
        if (contrastInput) contrastInput.checked = true;

        const fontInput = document.querySelector(`input[name="confFont"][value="${font}"]`);
        if (fontInput) fontInput.checked = true;

        // 3. Funciones de aplicación (actualizan atributos CSS globales al instante)
        const applyTheme = (val) => {
            document.documentElement.setAttribute('data-theme', val);
            localStorage.setItem('factu_theme', val);
        };

        const applyContrast = (val) => {
            if (val === 'high-contrast') {
                document.documentElement.setAttribute('data-a11y', 'high-contrast');
            } else {
                document.documentElement.removeAttribute('data-a11y');
            }
            localStorage.setItem('factu_contrast', val);
        };

        const applyFont = (val) => {
            document.documentElement.setAttribute('data-font', val);
            localStorage.setItem('factu_fontsize', val);
        };

        // 4. Listeners para escuchar los cambios del usuario
        document.querySelectorAll('input[name="confTheme"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) applyTheme(e.target.value);
            });
        });

        document.querySelectorAll('input[name="confContrast"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) applyContrast(e.target.value);
            });
        });

        document.querySelectorAll('input[name="confFont"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) applyFont(e.target.value);
            });
        });

    });

})();
