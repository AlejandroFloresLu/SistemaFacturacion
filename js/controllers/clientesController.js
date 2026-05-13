/**
 * clientesController.js — Controlador de Clientes
 * Lógica extraída del <script> inline de clientes.html.
 * Usa ClienteModel para obtener los datos.
 */
document.addEventListener('DOMContentLoaded', function () {

    let DB_CLIENTES    = [];
    let cliPaginaActual = 1;
    const CLI_POR_PAGINA = 5;
    let cliFiltrados   = [];
    let elimIdx        = null;

    // ── Filtrar ──────────────────────────────────────────────────────────────
    window.filtrarClientes = function () {
        const q = (document.getElementById('clienteSearch').value || '').toLowerCase();
        cliFiltrados = DB_CLIENTES.filter(c =>
            (c.nombre + ' ' + c.apellido).toLowerCase().includes(q) ||
            c.ruc.includes(q) ||
            c.email.toLowerCase().includes(q)
        );
        cliPaginaActual = 1;
        renderClientes();
    };

    // ── Paginación ───────────────────────────────────────────────────────────
    window.cliPagina = function (dir) {
        const tot = Math.ceil(cliFiltrados.length / CLI_POR_PAGINA);
        cliPaginaActual = Math.max(1, Math.min(cliPaginaActual + dir, tot));
        renderClientes();
    };

    // ── Render tabla ─────────────────────────────────────────────────────────
    function renderClientes() {
        const tbody  = document.getElementById('clientesTbody');
        const inicio = (cliPaginaActual - 1) * CLI_POR_PAGINA;
        const pag    = cliFiltrados.slice(inicio, inicio + CLI_POR_PAGINA);
        const tot    = Math.ceil(cliFiltrados.length / CLI_POR_PAGINA) || 1;

        document.getElementById('clientesContador').textContent =
            `Mostrando ${cliFiltrados.length} de ${DB_CLIENTES.length} clientes`;
        document.getElementById('cliPaginaNum').textContent = `${cliPaginaActual} / ${tot}`;
        document.getElementById('cliPrev').disabled = cliPaginaActual <= 1;
        document.getElementById('cliNext').disabled = cliPaginaActual >= tot;

        if (!pag.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">Sin resultados</td></tr>`;
            return;
        }
        tbody.innerHTML = pag.map(c => {
            const initials = (c.nombre[0] || '') + (c.apellido[0] || '');
            const idx = DB_CLIENTES.indexOf(c);
            return `<tr>
              <td class="ps-4"><div class="d-flex align-items-center">
                <div class="avatar-circle bg-primary bg-opacity-10 text-primary me-3" style="width:36px;height:36px;font-size:14px;">${initials}</div>
                <div class="fw-bold">${c.nombre} ${c.apellido}</div>
              </div></td>
              <td class="d-none d-md-table-cell">${c.ruc}</td>
              <td class="d-none d-lg-table-cell text-muted small">${c.tel}<br>${c.email}</td>
              <td class="d-none d-md-table-cell"><span class="badge bg-light text-dark border">${c.ultimaCompra}</span></td>
              <td class="text-end pe-4">
                <button class="btn btn-sm btn-light border-0 text-primary me-1" title="Editar" onclick="editarCliente(${idx})">
                  <i data-lucide="edit-2" style="width:15px;"></i></button>
                <button class="btn btn-sm btn-light border-0 text-danger" title="Eliminar" onclick="pedirEliminarCliente(${idx})">
                  <i data-lucide="trash-2" style="width:15px;"></i></button>
              </td>
            </tr>`;
        }).join('');
        lucide.createIcons();
    }

    // ── Nuevo Cliente ─────────────────────────────────────────────────────────
    window.abrirNuevoCliente = function () {
        ['cliNuevoNombre','cliNuevoApellido','cliNuevoRuc','cliNuevoTel','cliNuevoEmail']
            .forEach(id => { document.getElementById(id).value = ''; });
        new bootstrap.Modal(document.getElementById('modalNuevoCliente')).show();
    };

    window.guardarNuevoCliente = function () {
        const nom    = document.getElementById('cliNuevoNombre').value.trim();
        const ape    = document.getElementById('cliNuevoApellido').value.trim();
        const ruc    = document.getElementById('cliNuevoRuc').value.trim();
        const pais   = document.getElementById('cliNuevoTelPais').value;
        const telNum = document.getElementById('cliNuevoTel').value.trim();
        const tel    = telNum ? pais + ' ' + telNum : '';
        const email  = document.getElementById('cliNuevoEmail').value.trim();

        if (!nom) { mostrarToast('⚠️ El nombre es obligatorio.', 'danger'); return; }
        if (!ape) { mostrarToast('⚠️ El apellido es obligatorio.', 'danger'); return; }
        if (!ruc || (ruc.length !== 10 && ruc.length !== 13)) {
            mostrarToast('⚠️ La cédula debe tener 10 dígitos y el RUC 13.', 'danger'); return;
        }
        if (DB_CLIENTES.some(c => c.ruc === ruc)) {
            mostrarToast('⚠️ Ya existe un cliente con esa cédula/RUC.', 'danger'); return;
        }
        DB_CLIENTES.push({ id: Date.now(), nombre: nom, apellido: ape, ruc, tel,
            email: email || '(sin correo)', ultimaCompra: 'Nuevo' });
        bootstrap.Modal.getInstance(document.getElementById('modalNuevoCliente')).hide();
        window.filtrarClientes();
        mostrarToast(`✅ Cliente "${nom} ${ape}" agregado con éxito.`, 'success');
    };

    // ── Editar Cliente ────────────────────────────────────────────────────────
    window.editarCliente = function (idx) {
        const c = DB_CLIENTES[idx];
        document.getElementById('editCliIdx').value      = idx;
        document.getElementById('editCliNombre').value   = c.nombre;
        document.getElementById('editCliApellido').value = c.apellido;
        document.getElementById('editCliRuc').value      = c.ruc;
        document.getElementById('editCliEmail').value    = c.email;
        let telFull = c.tel || '', pais = '+593', num = telFull;
        if (telFull.startsWith('+')) {
            const parts = telFull.split(' ');
            if (parts.length > 1) { pais = parts[0]; num = parts.slice(1).join(' '); }
        }
        document.getElementById('editCliTelPais').value = pais;
        document.getElementById('editCliTel').value     = num;
        new bootstrap.Modal(document.getElementById('modalEditarCliente')).show();
    };

    window.guardarEdicionCliente = function () {
        const idx    = +document.getElementById('editCliIdx').value;
        const nom    = document.getElementById('editCliNombre').value.trim();
        const ape    = document.getElementById('editCliApellido').value.trim();
        const pais   = document.getElementById('editCliTelPais').value;
        const telNum = document.getElementById('editCliTel').value.trim();
        const tel    = telNum ? pais + ' ' + telNum : '';
        const email  = document.getElementById('editCliEmail').value.trim();
        if (!nom) { mostrarToast('⚠️ El nombre es obligatorio.', 'danger'); return; }
        if (!ape) { mostrarToast('⚠️ El apellido es obligatorio.', 'danger'); return; }
        DB_CLIENTES[idx].nombre   = nom;
        DB_CLIENTES[idx].apellido = ape;
        DB_CLIENTES[idx].tel      = tel;
        DB_CLIENTES[idx].email    = email;
        bootstrap.Modal.getInstance(document.getElementById('modalEditarCliente')).hide();
        window.filtrarClientes();
        mostrarToast('✅ Cliente editado con éxito', 'success');
    };

    // ── Eliminar Cliente ──────────────────────────────────────────────────────
    window.pedirEliminarCliente = function (idx) {
        elimIdx = idx;
        document.getElementById('elimCliNombre').textContent =
            DB_CLIENTES[idx].nombre + ' ' + DB_CLIENTES[idx].apellido;
        new bootstrap.Modal(document.getElementById('modalEliminarCliente')).show();
    };

    window.confirmarEliminarCliente = function () {
        if (elimIdx === null) return;
        const nombre = DB_CLIENTES[elimIdx].nombre;
        DB_CLIENTES.splice(elimIdx, 1);
        elimIdx = null;
        bootstrap.Modal.getInstance(document.getElementById('modalEliminarCliente')).hide();
        window.filtrarClientes();
        mostrarToast(`🗑️ Cliente "${nombre}" eliminado`, 'danger');
    };

    // ── Toast ─────────────────────────────────────────────────────────────────
    function mostrarToast(msg, tipo = 'success') {
        const t = document.createElement('div');
        t.className = `factu-toast ${tipo}`; t.innerHTML = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    // ── Arranque: cargar datos desde ClienteModel ─────────────────────────────
    ClienteModel.getAll().then(data => {
        DB_CLIENTES  = data;
        cliFiltrados = [...DB_CLIENTES];
        window.filtrarClientes();
    }).catch(() => mostrarToast('⚠️ No se pudo cargar los clientes.', 'danger'));
});
