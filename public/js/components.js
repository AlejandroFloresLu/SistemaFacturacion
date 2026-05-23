/**
 * components.js — Componentes UI Centralizados
 * Inyecta Sidebar, Topbar móvil y Panel de Accesibilidad en cada página.
 * Elimina la duplicación de HTML entre las 5+ vistas.
 */
const Components = (function () {
    'use strict';

    // ── Sidebar HTML ──────────────────────────────────────────────────────────
    const NAV_LINKS = [
        { href: 'factura.html', icon: 'zap', label: 'Nueva Factura' },
        { href: 'facturas-lista.html', icon: 'list', label: 'Ver Facturas' },
        { href: 'clientes.html', icon: 'users', label: 'Clientes' },
        { href: 'productos.html', icon: 'package', label: 'Productos' },
        { href: 'carga-masiva.html', icon: 'upload-cloud', label: 'Carga Masiva' },
    ];

    function getSidebarHTML(activePage) {
        const links = NAV_LINKS.map(l => {
            const isActive = activePage === l.href;
            const style = isActive
                ? 'color: var(--primary-color); font-weight: 600; background-color: #eef2ff; border: 1px solid #c7d2fe;'
                : 'color: var(--text-muted); font-weight: 500;';
            return `<a href="${l.href}" class="nav-link-custom text-decoration-none d-flex align-items-center px-3 py-2 mb-2 rounded" style="${style} transition: all 0.2s;">
                <i data-lucide="${l.icon}" class="me-2${isActive ? ' text-primary' : ''}" aria-hidden="true"></i> ${l.label}
            </a>`;
        }).join('');

        const user = sessionStorage.getItem('factu_user') || 'Admin';
        const initials = sessionStorage.getItem('factu_initials') || 'A';

        return `
        <div class="offcanvas-lg offcanvas-start sidebar" tabindex="-1" id="sidebarMenu">
            <div class="p-4 border-bottom d-flex align-items-center gap-3">
                <div class="text-white p-2 rounded-3" style="background-color:#0b4182;">
                    <i data-lucide="calculator" aria-hidden="true"></i>
                </div>
                <span class="h4 mb-0 fw-bold">FACTU</span>
                <button type="button" class="btn-close d-lg-none" data-bs-dismiss="offcanvas"
                    data-bs-target="#sidebarMenu" aria-label="Cerrar menú"></button>
            </div>
            <div class="offcanvas-body d-flex flex-column p-3 overflow-y-auto">
                <div class="flex-grow-1" id="navAccordion" role="navigation" aria-label="Menú principal">
                    ${links}
                </div>
                <button type="button" class="a11y-panel-btn" data-bs-toggle="offcanvas"
                    data-bs-target="#panelAccesibilidad" aria-label="Configuración">
                    <i data-lucide="settings-2" class="me-2" style="width:16px;height:16px;" aria-hidden="true"></i>
                    <span class="small fw-medium">Configuración</span>
                </button>
                <div class="mt-auto p-3 bg-light rounded-4 border">
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-circle" style="background-color:#0b4182;">${initials}</div>
                        <div>
                            <div class="fw-bold">Admin</div>
                            <div class="text-muted small">${user}</div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-outline-danger btn-sm mt-2 w-100" onclick="Components.logout()" aria-label="Cerrar sesión">
                    <i data-lucide="log-out" style="width:14px;" class="me-1" aria-hidden="true"></i> Cerrar sesión
                </button>
            </div>
        </div>`;
    }

    // ── Topbar móvil ──────────────────────────────────────────────────────────
    function getTopbarHTML() {
        return `
        <div class="d-lg-none page-header-topbar p-3 sticky-top">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <button class="btn btn-light border me-3" type="button"
                        data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu" aria-label="Abrir menú">
                        <i data-lucide="menu" aria-hidden="true"></i>
                    </button>
                    <span class="h5 mb-0 fw-bold" style="color:#0b4182;">FACTU</span>
                </div>
                <button class="btn btn-light border" type="button"
                    data-bs-toggle="offcanvas" data-bs-target="#panelAccesibilidad" aria-label="Configuración">
                    <i data-lucide="settings-2" style="width:18px;height:18px;" aria-hidden="true"></i>
                </button>
            </div>
        </div>`;
    }

    // ── Panel Accesibilidad ───────────────────────────────────────────────────
    function getA11yPanelHTML() {
        return `
        <div class="offcanvas offcanvas-end shadow-lg" tabindex="-1" id="panelAccesibilidad"
            aria-labelledby="panelAccesibilidadLabel" style="width:300px;max-width:100vw;">
            <div class="offcanvas-header border-bottom">
                <h5 class="offcanvas-title fw-bold d-flex align-items-center gap-2" id="panelAccesibilidadLabel">
                    <i data-lucide="settings-2" class="text-primary" style="width:20px;height:20px;"></i> Personalización
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
            </div>
            <div class="offcanvas-body">
                <p class="a11y-label">Tema</p>
                <div class="a11y-grid-2 mb-4">
                    <div class="a11y-card" id="a11yTheme_light" onclick="A11y.setTheme('light')" role="button" tabindex="0" aria-label="Tema claro">
                        <i data-lucide="sun" style="width:22px;height:22px;"></i>
                        <div style="font-size:.82rem;" class="mt-1">Claro</div>
                    </div>
                    <div class="a11y-card" id="a11yTheme_dark" onclick="A11y.setTheme('dark')" role="button" tabindex="0" aria-label="Tema oscuro">
                        <i data-lucide="moon" style="width:22px;height:22px;"></i>
                        <div style="font-size:.82rem;" class="mt-1">Oscuro</div>
                    </div>
                </div>
                <div class="d-none d-md-block">
                    <p class="a11y-label">Tamaño de texto</p>
                    <div class="a11y-grid-3 mb-4">
                        <div class="a11y-card" id="a11yFont_normal" onclick="A11y.setFont('normal')" role="button" tabindex="0">
                            <span style="font-size:1rem;font-weight:700;line-height:1;">A</span>
                            <div style="font-size:.72rem;" class="mt-1">Normal</div>
                        </div>
                        <div class="a11y-card" id="a11yFont_large" onclick="A11y.setFont('large')" role="button" tabindex="0">
                            <span style="font-size:1.4rem;font-weight:700;line-height:1;">A</span>
                            <div style="font-size:.72rem;" class="mt-1">Grande</div>
                        </div>
                        <div class="a11y-card" id="a11yFont_xlarge" onclick="A11y.setFont('xlarge')" role="button" tabindex="0">
                            <span style="font-size:1.8rem;font-weight:700;line-height:1;">A</span>
                            <div style="font-size:.72rem;" class="mt-1">Máximo</div>
                        </div>
                    </div>
                </div>
                <hr class="my-3">
                <button class="btn btn-outline-secondary w-100 btn-sm" onclick="A11y.reset()" aria-label="Restablecer configuración">
                    <i data-lucide="rotate-ccw" style="width:14px;height:14px;" aria-hidden="true"></i> Restablecer
                </button>
            </div>
        </div>`;
    }

    // ── Render en página ──────────────────────────────────────────────────────
    function render(activePage) {
        const sidebar = document.getElementById('sidebar-placeholder');
        if (sidebar) sidebar.outerHTML = getSidebarHTML(activePage);

        const topbar = document.getElementById('topbar-placeholder');
        if (topbar) topbar.outerHTML = getTopbarHTML();

        const a11y = document.getElementById('a11y-placeholder');
        if (a11y) a11y.outerHTML = getA11yPanelHTML();

        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof A11y !== 'undefined') A11y.init();
    }

    // ── Cerrar sesión ─────────────────────────────────────────────────────────
    function logout() {
        sessionStorage.clear();
        window.location.replace('login.html');
    }

    return { render, logout };
})();
