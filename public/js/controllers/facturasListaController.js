/**
 * facturasListaController.js — Controlador de Lista de Facturas
 * Carga datos reales de la API y permite anular facturas.
 */
document.addEventListener('DOMContentLoaded', function () {

    let DB_FACTURAS  = [];
    let paginaActual = 1;
    const POR_PAGINA = 5;
    let filtradas    = [];

    // ── Filtros ───────────────────────────────────────────────────────────────
    window.filtrarFacturas = function () {
        const desde  = document.getElementById('filtroDesde').value;
        const hasta  = document.getElementById('filtroHasta').value;
        const estado = document.getElementById('filtroEstado').value.toLowerCase();
        const texto  = document.getElementById('filtroTexto').value.toLowerCase().trim();

        filtradas = DB_FACTURAS.filter(f => {
            const okEstado = !estado || f.estado === estado;
            const okTexto  = !texto  || f.id.toLowerCase().includes(texto) || f.cliente.toLowerCase().includes(texto);
            const okDesde  = !desde  || f.fecha >= desde;
            const okHasta  = !hasta  || f.fecha <= hasta;
            return okEstado && okTexto && okDesde && okHasta;
        });
        paginaActual = 1;
        renderTabla();
    };

    // ── Paginación ────────────────────────────────────────────────────────────
    window.cambiarPagina = function (dir) {
        const totalPags = Math.ceil(filtradas.length / POR_PAGINA);
        paginaActual = Math.max(1, Math.min(paginaActual + dir, totalPags));
        renderTabla();
    };

    // ── Render tabla ──────────────────────────────────────────────────────────
    function renderTabla() {
        const tbody     = document.getElementById('facturasTbody');
        const inicio    = (paginaActual - 1) * POR_PAGINA;
        const pagina    = filtradas.slice(inicio, inicio + POR_PAGINA);
        const totalPags = Math.ceil(filtradas.length / POR_PAGINA) || 1;

        document.getElementById('facturaContador').textContent =
            `Mostrando ${filtradas.length} de ${DB_FACTURAS.length} registros`;
        document.getElementById('paginaNum').textContent = `${paginaActual} / ${totalPags}`;
        document.getElementById('btnPrev').disabled = paginaActual <= 1;
        document.getElementById('btnNext').disabled = paginaActual >= totalPags;

        if (!pagina.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">
                <i data-lucide="search-x" style="width:40px;height:40px;opacity:.4;" class="mb-2"></i>
                <br>No hay facturas con esos filtros</td></tr>`;
            lucide.createIcons(); return;
        }

        tbody.innerHTML = pagina.map(f => {
            const esAprobado = f.estado === 'aprobado';
            const badge  = esAprobado
                ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">Aprobado</span>`
                : `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i data-lucide="x-circle" style="width:12px;margin-right:3px;display:inline-block;"></i>Anulado</span>`;
            const totalHTML = esAprobado
                ? `<span class="fw-bold text-dark">$ ${f.total.toFixed(2)}</span>`
                : `<span class="fw-bold text-muted text-decoration-line-through">$ ${f.total.toFixed(2)}</span>`;
            const accion = esAprobado
                ? `<div class="d-flex gap-1 justify-content-end">
                     <button class="btn btn-sm btn-primary" title="Imprimir PDF" onclick="imprimirFactura('${f.id}')"><i data-lucide="printer" style="width:15px;"></i></button>
                     <button class="btn btn-sm btn-outline-danger" title="Anular Factura" onclick="pedirAnularFactura('${f.id}')"><i data-lucide="ban" style="width:15px;"></i></button>
                   </div>`
                : `<button class="btn btn-sm btn-outline-secondary" title="Ver Detalle Anulado" onclick="verAnulado('${f.id}')"><i data-lucide="eye" style="width:15px;"></i></button>`;
            return `<tr>
                <td class="ps-4 fw-bold ${esAprobado ? 'text-primary' : 'text-danger'}">${f.id}</td>
                <td class="d-none d-md-table-cell text-muted small">${f.fechaDisplay}</td>
                <td class="d-none d-sm-table-cell fw-bold">${f.cliente}</td>
                <td>${badge}</td>
                <td class="text-end">${totalHTML}</td>
                <td class="text-end pe-4">${accion}</td>
            </tr>`;
        }).join('');
        lucide.createIcons();
    }

    // ── Imprimir Factura ──────────────────────────────────────────────────────
    window.imprimirFactura = async function (id) {
        mostrarToast(`🔍 Cargando factura ${id}...`, 'info');
        try {
            const f = await FacturaModel.getById(id);
            _abrirImpresionFactura(f);   // utilidad compartida en printFactura.js
        } catch {
            mostrarToast('⚠️ No se pudo cargar la factura para imprimir.', 'danger');
        }
    };

    // Variable temporal para el id a anular
    let _anularId = null;

    window.pedirAnularFactura = function (id) {
        _anularId = id;
        // Reutilizar modal de detalle o crear uno inline
        const f = DB_FACTURAS.find(x => x.id === id);
        if (!f) return;
        document.getElementById('detNumFactura').textContent = f.id;
        document.getElementById('detCliente').textContent    = f.cliente;
        document.getElementById('detFecha').textContent      = f.fechaDisplay || f.fecha;
        document.getElementById('detTotal').textContent      = '$ ' + f.total.toFixed(2);

        // Cambiar título del modal si existe
        const modalTitle = document.querySelector('#modalDetalleAnulado .modal-title');
        if (modalTitle) modalTitle.textContent = '⚠️ ¿Anular esta factura?';

        // Mostrar botón de confirmar anulación
        let btnAnular = document.getElementById('btnConfirmarAnulacion');
        if (!btnAnular) {
            btnAnular = document.createElement('button');
            btnAnular.id = 'btnConfirmarAnulacion';
            btnAnular.className = 'btn btn-danger fw-bold';
            btnAnular.textContent = 'Sí, anular';
            btnAnular.onclick = confirmarAnulacion;
            document.querySelector('#modalDetalleAnulado .modal-footer')?.appendChild(btnAnular);
        }
        btnAnular.style.display = '';

        new bootstrap.Modal(document.getElementById('modalDetalleAnulado')).show();
    };

    async function confirmarAnulacion() {
        if (!_anularId) return;
        const id = _anularId; _anularId = null;
        bootstrap.Modal.getInstance(document.getElementById('modalDetalleAnulado')).hide();
        try {
            await FacturaModel.anular(id);
            await recargarFacturas();
            mostrarToast(`🚫 Factura ${id} anulada`, 'danger');
        } catch (err) {
            mostrarToast(`⚠️ ${err.message}`, 'danger');
        }
    }

    window.verAnulado = function (id) {
        const f = DB_FACTURAS.find(x => x.id === id);
        if (!f) return;
        document.getElementById('detNumFactura').textContent = f.id;
        document.getElementById('detCliente').textContent    = f.cliente;
        document.getElementById('detFecha').textContent      = f.fechaDisplay || f.fecha;
        document.getElementById('detTotal').textContent      = '$ ' + f.total.toFixed(2);

        const modalTitle = document.querySelector('#modalDetalleAnulado .modal-title');
        if (modalTitle) modalTitle.textContent = 'Detalle de Factura Anulada';

        const btnAnular = document.getElementById('btnConfirmarAnulacion');
        if (btnAnular) btnAnular.style.display = 'none';

        new bootstrap.Modal(document.getElementById('modalDetalleAnulado')).show();
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    async function recargarFacturas() {
        FacturaModel.clearCache();
        DB_FACTURAS = await FacturaModel.getAll();
        filtradas   = [...DB_FACTURAS];
        window.filtrarFacturas();
    }

    function mostrarToast(msg, tipo = 'success') {
        const t = document.createElement('div');
        t.className = `factu-toast ${tipo}`; t.innerHTML = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    // ── Arranque ──────────────────────────────────────────────────────────────
    FacturaModel.getAll().then(data => {
        DB_FACTURAS = data;
        filtradas   = [...DB_FACTURAS];
        window.filtrarFacturas();
    }).catch(() => mostrarToast('⚠️ No se pudo cargar las facturas.', 'danger'));
});
