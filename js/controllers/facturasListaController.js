/**
 * facturasListaController.js — Controlador de Lista de Facturas
 * Lógica extraída del <script> inline de facturas-lista.html.
 * Usa FacturaModel para obtener y filtrar datos.
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
                ? `<button class="btn btn-sm btn-primary" title="Imprimir PDF" onclick="imprimirFactura('${f.id}')"><i data-lucide="printer" style="width:15px;"></i></button>`
                : `<button class="btn btn-sm btn-outline-danger" title="Ver Detalle Anulado" onclick="verAnulado('${f.id}')"><i data-lucide="eye" style="width:15px;"></i></button>`;
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

    // ── Acciones ──────────────────────────────────────────────────────────────
    window.imprimirFactura = function (id) {
        mostrarToast(`🖨️ Enviando a imprimir: ${id}`, 'info');
        setTimeout(() => window.print(), 400);
    };

    window.verAnulado = function (id) {
        const f = DB_FACTURAS.find(x => x.id === id);
        if (!f) return;
        document.getElementById('detNumFactura').textContent = f.id;
        document.getElementById('detCliente').textContent    = f.cliente;
        document.getElementById('detFecha').textContent      = f.fecha;
        document.getElementById('detTotal').textContent      = '$ ' + f.total.toFixed(2);
        new bootstrap.Modal(document.getElementById('modalDetalleAnulado')).show();
    };

    function mostrarToast(msg, tipo = 'success') {
        const t = document.createElement('div');
        t.className = `factu-toast ${tipo}`; t.innerHTML = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    // ── Arranque: cargar datos desde FacturaModel ─────────────────────────────
    FacturaModel.getAll().then(data => {
        DB_FACTURAS = data;
        filtradas   = [...DB_FACTURAS];
        window.filtrarFacturas();
    }).catch(() => mostrarToast('⚠️ No se pudo cargar las facturas.', 'danger'));
});
