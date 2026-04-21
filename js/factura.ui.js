document.addEventListener("DOMContentLoaded", function() {

    // =====================================================================
    // ELEMENTOS DEL DOM
    // =====================================================================
    const spotlightInput   = document.getElementById('spotlightProduct');
    const invoiceItems     = document.getElementById('invoiceItems');
    const btnPagar         = document.getElementById('btnPagar');
    const btnCancelar      = document.getElementById('btnCancelarFactura');
    const btnPausar        = document.getElementById('btnPausarFactura');
    const listaEsperaWrap  = document.getElementById('listaEsperaWrap');
    const listaEsperaUl    = document.getElementById('listaEspera');
    const contadorEspera   = document.getElementById('contadorEspera');

    // Fecha emisión
    const fechaEmision = document.getElementById('fechaEmision');
    if (fechaEmision) {
        const today = new Date();
        fechaEmision.innerText = today.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    // Cliente
    const clienteSearch             = document.getElementById('clienteSearch');
    const btnEscape                 = document.getElementById('btnEscape');
    const modalNuevoCliente         = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
    const vistaBusquedaCliente      = document.getElementById('vistaBusquedaCliente');
    const panelClienteNoEncontrado  = document.getElementById('panelClienteNoEncontrado');
    const txtRucNoEncontrado        = document.getElementById('txtRucNoEncontrado');
    const vistaClienteSeleccionado  = document.getElementById('vistaClienteSeleccionado');
    const btnBuscarDeNuevo          = document.getElementById('btnBuscarDeNuevo');
    const btnCrearNuevoClienteDirecto = document.getElementById('btnCrearNuevoClienteDirecto');

    // Pagos y Totales
    const methodSelect  = document.getElementById('paymentMethod');
    const amountInput   = document.getElementById('paymentAmount');
    const btnAddPayment = document.getElementById('btnAddPayment');
    const paymentList   = document.getElementById('paymentList');
    const lblSubtotal   = document.getElementById('lblSubtotal');
    const lblIva        = document.getElementById('lblIva');
    const lblTotal      = document.getElementById('lblTotal');
    const lblPagado     = document.getElementById('lblPagado');
    const lblSaldo      = document.getElementById('lblSaldo');
    const containerSaldo = document.getElementById('containerSaldo');

    // Tipo documento
    const radiosTipo            = document.querySelectorAll('input[name="tipoComprobanteRadio"]');
    const contenedorVinculacionNC = document.getElementById('contenedorVinculacionNC');
    const facturaVinculada      = document.getElementById('facturaVinculada');
    let tipoActual = 'factura';

    radiosTipo.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                tipoActual = e.target.value;
                if (tipoActual === 'nc') {
                    contenedorVinculacionNC.classList.remove('d-none');
                } else {
                    contenedorVinculacionNC.classList.add('d-none');
                    facturaVinculada.value = '';
                }
                if (invoiceLines.length > 0) calculateTotals();
            }
        });
    });
    if (facturaVinculada) facturaVinculada.addEventListener('input', calculateTotals);

    // =====================================================================
    // ESTADO GLOBAL
    // =====================================================================
    const IVA_RATE   = 0.15;
    const LS_ACTIVE  = 'factu_active_invoice';
    const LS_PAUSED  = 'factu_paused_invoices';

    let invoiceLines = [];
    let payments     = [];
    let clienteActual = null;   // { nombre, ruc }
    let pausedList   = [];

    // =====================================================================
    // localStorage HELPERS
    // =====================================================================
    function saveActive() {
        const estado = {
            cliente:    clienteActual,
            lines:      invoiceLines,
            payments:   payments,
            tipo:       tipoActual,
            timestamp:  Date.now()
        };
        localStorage.setItem(LS_ACTIVE, JSON.stringify(estado));
    }

    function clearActive() {
        localStorage.removeItem(LS_ACTIVE);
    }

    function loadActive() {
        try { return JSON.parse(localStorage.getItem(LS_ACTIVE)) || null; }
        catch(e) { return null; }
    }

    function savePaused() {
        localStorage.setItem(LS_PAUSED, JSON.stringify(pausedList));
    }

    function loadPaused() {
        try { return JSON.parse(localStorage.getItem(LS_PAUSED)) || []; }
        catch(e) { return []; }
    }

    // =====================================================================
    // RESTAURAR ESTADO AL CARGAR
    // =====================================================================
    pausedList = loadPaused();
    renderListaEspera();

    const saved = loadActive();
    if (saved && (saved.lines.length > 0 || saved.cliente)) {
        invoiceLines  = saved.lines      || [];
        payments      = saved.payments   || [];
        tipoActual    = saved.tipo       || 'factura';
        clienteActual = saved.cliente    || null;

        if (clienteActual) {
            setCliente(clienteActual.nombre, clienteActual.ruc, false);
        }
        if (tipoActual === 'nc') {
            contenedorVinculacionNC.classList.remove('d-none');
            document.getElementById('radioNC').checked = true;
        }
        if (invoiceLines.length > 0) {
            amountInput.disabled    = false;
            btnAddPayment.disabled  = false;
        }
        renderLines();
        renderPayments();

        mostrarToast('📋 Factura restaurada desde donde la dejaste', 'info');
    }

    // =====================================================================
    // ATAJOS DE TECLADO
    // =====================================================================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
            e.preventDefault();
            if (!btnPagar.disabled) btnPagar.click();
        }
        if (e.key === 'Escape' && document.activeElement === document.body) {
            if (btnEscape) btnEscape.click();
        }
    });

    // =====================================================================
    // VALIDACIÓN CÉDULA ECUATORIANA
    // =====================================================================
    function validarCedulaEcuatoriana(cedula) {
        if (cedula.length !== 10 || !/^\d+$/.test(cedula)) return false;
        var region = parseInt(cedula.substring(0, 2), 10);
        if (region < 1 || region > 24) return false;
        var tercer_digito = parseInt(cedula.substring(2, 3), 10);
        if (tercer_digito > 5) return false;
        var suma = 0;
        for (var i = 0; i < 9; i++) {
            var valor = parseInt(cedula.charAt(i), 10);
            if (i % 2 === 0) { valor = valor * 2; if (valor > 9) valor -= 9; }
            suma += valor;
        }
        var digito_verificador = parseInt(cedula.charAt(9), 10);
        var decena_superior = Math.ceil(suma / 10) * 10;
        var resultado = decena_superior - suma;
        if (resultado === 10) resultado = 0;
        return resultado === digito_verificador;
    }

    // =====================================================================
    // BÚSQUEDA Y CREACIÓN DE CLIENTES
    // =====================================================================
    function procesarBusquedaCliente() {
        const val = clienteSearch.value.trim();

        // 1. Campo vacío
        if (!val) {
            mostrarToast('⚠️ Tienes que llenar los datos.', 'danger');
            clienteSearch.focus();
            return;
        }

        // 2. Formato incorrecto: no es numérico, o no tiene 10 ni 13 dígitos
        if (!/^\d+$/.test(val) || (val.length !== 10 && val.length !== 13)) {
            mostrarToast('❌ Debes ingresar de 10 a 13 dígitos.', 'danger');
            clienteSearch.select();
            return;
        }

        // 3. Cédula de 10 dígitos: validar dígito verificador (excepto consumidor final)
        if (val.length === 10 && val !== '9999999999') {
            if (!validarCedulaEcuatoriana(val)) {
                mostrarToast('❌ La cédula ingresada no es válida. Verifica los dígitos e intenta de nuevo.', 'danger');
                clienteSearch.select();
                return;
            }
        }

        // 4. Buscar en la base de datos
        if (val === '9999999999')         { setCliente('Consumidor Final', '9999999999'); }
        else if (val === '1201201201')    { setCliente('Alejandro Flores', '1201201201'); }
        else if (val === '1792929292001') { setCliente('Empresa Ficticia S.A.', '1792929292001'); }
        else {
            // Cliente no encontrado
            mostrarToast('No se encontró el cliente.', 'warning');
            txtRucNoEncontrado.innerText = val;
            vistaBusquedaCliente.classList.add('d-none');
            panelClienteNoEncontrado.classList.remove('d-none');
        }
    }

    clienteSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); procesarBusquedaCliente(); }
    });
    document.getElementById('btnBuscarClienteIcon').addEventListener('click', procesarBusquedaCliente);

    btnBuscarDeNuevo.addEventListener('click', () => {
        panelClienteNoEncontrado.classList.add('d-none');
        vistaBusquedaCliente.classList.remove('d-none');
        clienteSearch.value = '';
        clienteSearch.focus();
    });

    btnCrearNuevoClienteDirecto.addEventListener('click', () => {
        document.getElementById('modalRuc').value = txtRucNoEncontrado.innerText;
        document.getElementById('modalNombre').value    = '';
        document.getElementById('modalApellido').value  = '';
        modalNuevoCliente.show();
    });

    document.getElementById('btnGuardarCliente').addEventListener('click', () => {
        const nom = document.getElementById('modalNombre').value;
        const ape = document.getElementById('modalApellido').value;
        const ruc = document.getElementById('modalRuc').value;
        if (nom) { setCliente(`${nom} ${ape}`, ruc); modalNuevoCliente.hide(); }
    });

    btnEscape.addEventListener('click', () => {
        vistaClienteSeleccionado.classList.add('d-none');
        vistaBusquedaCliente.classList.remove('d-none');
        clienteActual = null;
        clienteSearch.value = '';
        clienteSearch.focus();
        saveActive();
    });

    function setCliente(name, ruc, doSave = true) {
        vistaBusquedaCliente.classList.add('d-none');
        panelClienteNoEncontrado.classList.add('d-none');
        vistaClienteSeleccionado.classList.remove('d-none');
        document.getElementById('nombreClienteSeleccionado').innerText = name;
        document.getElementById('rucClienteSeleccionado').innerText = ruc;
        clienteActual = { nombre: name, ruc };
        if (doSave) saveActive();
        spotlightInput.focus();
    }

    // =====================================================================
    // PRODUCTOS
    // =====================================================================
    const DB_PRODUCTS = [
        { id: 'VUE-001', desc: 'Boleto aéreo nacional - Económica', price: 120.00 },
        { id: 'VUE-002', desc: 'Boleto aéreo nacional - Ejecutiva', price: 250.00 },
        { id: 'VUE-003', desc: 'Boleto aéreo internacional - Económica', price: 800.00 },
        { id: 'VUE-004', desc: 'Boleto aéreo internacional - Ejecutiva', price: 1500.00 },
        { id: 'ALO-001', desc: 'Estancia en hotel nacional - Estándar', price: 60.00 },
        { id: 'ALO-005', desc: 'Resort todo incluido - Nacional', price: 200.00 },
        { id: 'TRS-001', desc: 'Alquiler de vehículo - Económica', price: 40.00 },
        { id: 'TRS-004', desc: 'Traslado privado (Aeropuerto - Hotel)', price: 30.00 },
        { id: 'PAQ-001', desc: 'Paquete turístico nacional - Estándar', price: 350.00 },
        { id: 'PAQ-006', desc: 'Paquete vacacional - Luna de Miel', price: 1200.00 },
        { id: 'CRU-003', desc: 'Cabina de crucero - Balcón / Suite', price: 2500.00 },
        { id: 'SEG-002', desc: 'Póliza asistencia viajero - Internacional', price: 85.00 },
        { id: 'ACT-002', desc: 'Excursión guiada día completo', price: 75.00 },
        { id: 'ADM-002', desc: 'Cargo emisión de boleto (Fee agencia)', price: 25.00 }
    ];

    const datalistProductos = document.getElementById('productosList');
    if (datalistProductos) {
        DB_PRODUCTS.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.desc;
            opt.textContent = p.id + ' - $' + p.price.toFixed(2);
            datalistProductos.appendChild(opt);
        });
    }

    function procesarBusquedaProducto() {
        const term = spotlightInput.value.toLowerCase().trim();
        if (!term) return;
        const matched = DB_PRODUCTS.find(p => p.desc.toLowerCase().includes(term) || p.id.toLowerCase() === term);
        if (matched) {
            window.addProduct(matched.id, matched.desc, matched.price);
            spotlightInput.value = '';
        } else {
            mostrarToast('Producto no encontrado en el inventario', 'danger');
        }
    }

    spotlightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); procesarBusquedaProducto(); }
    });
    const btnBuscarProductoIcon = document.getElementById('btnBuscarProductoIcon');
    if (btnBuscarProductoIcon) btnBuscarProductoIcon.addEventListener('click', procesarBusquedaProducto);

    window.addProduct = function(id, desc, price) {
        const exist = invoiceLines.find(i => i.id === id);
        if (exist) {
            exist.qty += 1;
            exist.total = exist.qty * exist.price;
        } else {
            invoiceLines.push({ id, desc, price, qty: 1, total: price });
        }
        amountInput.disabled   = false;
        btnAddPayment.disabled = false;
        renderLines();
        saveActive();
    };

    window.removeProduct = function(id) {
        invoiceLines = invoiceLines.filter(i => i.id !== id);

        // Al eliminar un producto, se borran todos los pagos para evitar saldos negativos
        const pagosEliminados = payments.length > 0;
        payments = [];
        renderPayments();

        if (invoiceLines.length === 0) {
            amountInput.disabled   = true;
            btnAddPayment.disabled = true;
        }
        renderLines();
        saveActive();

        if (pagosEliminados) {
            mostrarToast('🗑️ Producto eliminado. Los pagos han sido reiniciados.', 'warning');
        }
    };

    window.updateQty = function(id, qtyStr) {
        let qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0) return;
        if (qty > 1000000) {
            qty = 1000000;
            mostrarToast('⚠️ La cantidad máxima permitida es 1,000,000.', 'warning');
        }
        const exist = invoiceLines.find(i => i.id === id);
        if (exist) { exist.qty = qty; exist.total = exist.qty * exist.price; calculateTotals(); saveActive(); }
    };

    window.updatePrice = function(id, priceStr) {
        let price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) return;
        if (price > 10000000) {
            price = 10000000;
            mostrarToast('⚠️ El precio máximo permitido es $10,000,000.00.', 'warning');
        }
        price = Math.round(price * 100) / 100;  // máx 2 decimales
        const exist = invoiceLines.find(i => i.id === id);
        if (exist) { exist.price = price; exist.total = exist.qty * exist.price; calculateTotals(); saveActive(); }
    };

    function renderLines() {
        if (invoiceLines.length === 0) {
            invoiceItems.innerHTML = `<tr id="emptyInvoiceRow"><td colspan="4" class="text-center text-muted py-5">
                <i data-lucide="inbox" class="mb-2 opacity-50" style="width:48px;height:48px;" aria-hidden="true"></i><br>Agrega productos a la factura</td></tr>`;
        } else {
            invoiceItems.innerHTML = '';
            invoiceLines.forEach(line => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold align-middle">
                        <button class="btn btn-sm btn-light text-danger border-0 p-1 me-2" onclick="removeProduct('${line.id}')"
                            title="Quitar producto" aria-label="Quitar ${line.desc}">
                            <i data-lucide="trash-2" style="width:16px;height:16px;" aria-hidden="true"></i>
                        </button>
                        ${line.desc}
                    </td>
                    <td class="text-center align-middle" style="width:100px;">
                        <input type="number" class="form-control form-control-sm text-center" value="${line.qty}" min="1" max="1000000"
                            onkeydown="if(['e','E','+','-','.'].includes(event.key)) event.preventDefault();"
                            onchange="updateQty('${line.id}', this.value)"
                            aria-label="Cantidad de ${line.desc}">
                    </td>
                    <td class="text-end align-middle px-3" style="width:130px;">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white border-end-0 text-muted px-2" aria-hidden="true">$</span>
                            <input type="number" class="form-control border-start-0 ps-0 text-end" value="${line.price.toFixed(2)}" min="0.01" max="10000000" step="0.01"
                                onkeydown="if(['e','E','+','-'].includes(event.key)) event.preventDefault();"
                                onchange="updatePrice('${line.id}', this.value)"
                                aria-label="Precio unitario de ${line.desc}">
                        </div>
                    </td>
                    <td class="text-end align-middle fw-bold" aria-label="Total $${line.total.toFixed(2)}">$${line.total.toFixed(2)}</td>
                `;
                invoiceItems.appendChild(tr);
            });
        }
        lucide.createIcons();
        calculateTotals();
    }

    // =====================================================================
    // TOTALES Y VALIDACIÓN
    // =====================================================================
    function calculateTotals() {
        const subtotal = invoiceLines.reduce((acc, cur) => acc + cur.total, 0);
        const iva = subtotal * IVA_RATE;
        const total = subtotal + iva;
        lblSubtotal.textContent = subtotal.toFixed(2);
        lblIva.textContent      = iva.toFixed(2);
        lblTotal.textContent    = total.toFixed(2);
        amountInput.value       = (total - getPagado()).toFixed(2);
        validatePayments(total);
    }

    function getPagado() {
        return payments.reduce((acc, p) => acc + p.amount, 0);
    }

    function validatePayments(total) {
        const pagado = getPagado();
        const saldo  = total - pagado;
        lblPagado.textContent = pagado.toFixed(2);

        let vinculacionOk = true;
        if (tipoActual === 'nc' && facturaVinculada && facturaVinculada.value.trim() === '') {
            vinculacionOk = false;
        }

        if (saldo <= 0 && invoiceLines.length > 0 && vinculacionOk) {
            lblSaldo.textContent = '0.00';
            containerSaldo.style.color = '#15803d';
            btnPagar.disabled = false;
        } else {
            lblSaldo.textContent = saldo > 0 ? saldo.toFixed(2) : '0.00';
            containerSaldo.style.color = '#dc3545';
            btnPagar.disabled = true;
        }
    }

    // =====================================================================
    // PAGOS MIXTOS
    // =====================================================================
    btnAddPayment.addEventListener('click', () => {
        const m = methodSelect.options[methodSelect.selectedIndex].text;
        const v = parseFloat(amountInput.value);
        if (isNaN(v) || v <= 0) return;
        payments.push({ id: Date.now(), method: m, amount: v });
        renderPayments();
        calculateTotals();
        saveActive();
    });

    window.removePayment = function(id) {
        payments = payments.filter(p => p.id !== id);
        renderPayments();
        calculateTotals();
        saveActive();
    };

    function renderPayments() {
        paymentList.innerHTML = '';
        payments.forEach(p => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2';
            li.innerHTML = `
                <span><i data-lucide="check-circle" class="text-success me-2" style="width:14px;height:14px;" aria-hidden="true"></i>${p.method}</span>
                <span>
                    <span class="fw-bold me-3" aria-label="Monto $${p.amount.toFixed(2)}">$${p.amount.toFixed(2)}</span>
                    <button class="btn btn-sm text-danger p-0 border-0" onclick="removePayment(${p.id})" aria-label="Quitar pago de ${p.method}">
                        <i data-lucide="x" style="width:16px;height:16px;" aria-hidden="true"></i>
                    </button>
                </span>`;
            paymentList.appendChild(li);
        });
        lucide.createIcons();
    }

    // =====================================================================
    // LIMPIAR FORMULARIO (utilidad interna)
    // =====================================================================
    function limpiarFormulario() {
        invoiceLines  = [];
        payments      = [];
        clienteActual = null;

        // UI cliente
        vistaClienteSeleccionado.classList.add('d-none');
        panelClienteNoEncontrado.classList.add('d-none');
        vistaBusquedaCliente.classList.remove('d-none');
        clienteSearch.value = '';

        // UI productos/pagos
        amountInput.disabled    = true;
        btnAddPayment.disabled  = true;
        renderLines();
        renderPayments();

        // Tipo
        tipoActual = 'factura';
        document.getElementById('radioFactura').checked = true;
        contenedorVinculacionNC.classList.add('d-none');
        if (facturaVinculada) facturaVinculada.value = '';

        clienteSearch.focus();
    }

    // =====================================================================
    // PAUSAR FACTURA
    // =====================================================================
    if (btnPausar) {
        btnPausar.addEventListener('click', () => {
            if (invoiceLines.length === 0 && !clienteActual) {
                mostrarToast('No hay datos para pausar', 'danger');
                return;
            }
            const paused = {
                id:       Date.now(),
                cliente:  clienteActual,
                lines:    [...invoiceLines],
                payments: [...payments],
                tipo:     tipoActual,
                ts:       Date.now()
            };
            pausedList.push(paused);
            savePaused();
            clearActive();
            limpiarFormulario();
            renderListaEspera();
            mostrarToast('⏸ Factura pausada — lista para reanudar', 'info');
        });
    }

    // =====================================================================
    // CANCELAR / LIMPIAR FACTURA ACTIVA
    // =====================================================================
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (invoiceLines.length === 0 && !clienteActual) {
                mostrarToast('No hay datos activos que limpiar', 'danger');
                return;
            }
            // Modal de confirmación
            if (!document.getElementById('modalCancelarFactura')) {
                const m = document.createElement('div');
                m.innerHTML = `
                <div class="modal fade" id="modalCancelarFactura" tabindex="-1" aria-labelledby="modalCancelarLbl" aria-modal="true" role="dialog">
                    <div class="modal-dialog modal-dialog-centered modal-sm">
                        <div class="modal-content border-0 shadow-lg" style="border-radius:16px;">
                            <div class="modal-body p-4 text-center">
                                <div style="font-size:2.5rem;">🗑️</div>
                                <h5 class="fw-bold text-dark mb-1 mt-2" id="modalCancelarLbl">¿Descartar factura?</h5>
                                <p class="text-muted small mb-3">Se perderán todos los datos del formulario actual.</p>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-light fw-bold flex-grow-1" data-bs-dismiss="modal" aria-label="Mantener factura">Cancelar</button>
                                    <button class="btn btn-danger fw-bold flex-grow-1" id="btnConfirmarCancelar" aria-label="Confirmar descarte de factura">Sí, descartar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.body.appendChild(m.firstElementChild);
                document.getElementById('btnConfirmarCancelar').addEventListener('click', () => {
                    bootstrap.Modal.getInstance(document.getElementById('modalCancelarFactura')).hide();
                    clearActive();
                    limpiarFormulario();
                    mostrarToast('🗑️ Factura descartada', 'danger');
                });
            }
            new bootstrap.Modal(document.getElementById('modalCancelarFactura')).show();
        });
    }

    // =====================================================================
    // LISTA DE FACTURAS EN ESPERA
    // =====================================================================
    function renderListaEspera() {
        if (!listaEsperaWrap || !listaEsperaUl) return;
        if (pausedList.length === 0) {
            listaEsperaWrap.classList.add('d-none');
            if (contadorEspera) contadorEspera.textContent = '';
            return;
        }
        listaEsperaWrap.classList.remove('d-none');
        if (contadorEspera) contadorEspera.textContent = pausedList.length;

        listaEsperaUl.innerHTML = '';
        pausedList.forEach((f, idx) => {
            const nombre  = f.cliente ? f.cliente.nombre : 'Sin cliente';
            const items   = f.lines.reduce((a, l) => a + l.qty, 0);
            const total   = f.lines.reduce((a, l) => a + l.total, 0) * (1 + IVA_RATE);
            const hora    = new Date(f.ts).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center px-3 py-2 bg-transparent border-bottom';
            li.setAttribute('role', 'listitem');
            li.innerHTML = `
                <div class="flex-grow-1 me-2" style="min-width:0;">
                    <div class="fw-bold small text-truncate">${nombre}</div>
                    <div class="text-muted" style="font-size:.72rem;">${items} ítem(s) · $${total.toFixed(2)} · ${hora}</div>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-primary border-0 py-0 px-2" onclick="reanudarFactura(${idx})"
                        aria-label="Reanudar factura de ${nombre}" title="Reanudar">
                        <i data-lucide="play" style="width:14px;height:14px;" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0 py-0 px-2" onclick="descartarFacturaPausada(${idx})"
                        aria-label="Descartar factura pausada de ${nombre}" title="Descartar">
                        <i data-lucide="trash-2" style="width:14px;height:14px;" aria-hidden="true"></i>
                    </button>
                </div>`;
            listaEsperaUl.appendChild(li);
        });
        lucide.createIcons();
    }

    window.reanudarFactura = function(idx) {
        const f = pausedList[idx];
        if (!f) return;

        // Guardar la factura activa si tiene contenido (la pausa automática)
        if (invoiceLines.length > 0 || clienteActual) {
            const autopaused = {
                id: Date.now(), cliente: clienteActual,
                lines: [...invoiceLines], payments: [...payments],
                tipo: tipoActual, ts: Date.now()
            };
            pausedList.push(autopaused);
        }

        // Cargar la seleccionada
        pausedList.splice(idx, 1);
        savePaused();

        invoiceLines  = f.lines    || [];
        payments      = f.payments || [];
        tipoActual    = f.tipo     || 'factura';
        clienteActual = f.cliente  || null;

        if (clienteActual) {
            setCliente(clienteActual.nombre, clienteActual.ruc, false);
        } else {
            vistaClienteSeleccionado.classList.add('d-none');
            vistaBusquedaCliente.classList.remove('d-none');
        }
        if (tipoActual === 'nc') {
            contenedorVinculacionNC.classList.remove('d-none');
            document.getElementById('radioNC').checked = true;
        } else {
            contenedorVinculacionNC.classList.add('d-none');
            document.getElementById('radioFactura').checked = true;
        }
        if (invoiceLines.length > 0) {
            amountInput.disabled   = false;
            btnAddPayment.disabled = false;
        }
        renderLines();
        renderPayments();
        renderListaEspera();
        saveActive();
        mostrarToast('▶ Factura reanudada', 'success');
    };

    window.descartarFacturaPausada = function(idx) {
        const nombre = pausedList[idx]?.cliente?.nombre || 'Sin cliente';
        pausedList.splice(idx, 1);
        savePaused();
        renderListaEspera();
        mostrarToast(`🗑️ Factura de "${nombre}" descartada`, 'danger');
    };

    // =====================================================================
    // MODAL APROBACIÓN FINAL
    // =====================================================================
    btnPagar.addEventListener('click', () => {
        const nombreCliente = vistaClienteSeleccionado.classList.contains('d-none')
            ? 'Consumidor Final (Defecto)'
            : document.getElementById('nombreClienteSeleccionado').innerText;
        document.getElementById('modalConfirmCliente').innerText = nombreCliente;
        document.getElementById('modalConfirmItems').innerText = invoiceLines.reduce((a, c) => a + c.qty, 0);
        document.getElementById('modalConfirmTotal').innerText = lblTotal.innerText;
    });

    document.getElementById('btnConfirmarAprobacion').addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('modalAprobarFactura')).hide();
        clearActive();
        limpiarFormulario();
        mostrarToast('✅ ¡Factura emitida correctamente! Enviada a impresión.', 'success');
        setTimeout(() => window.print(), 600);
    });

    // =====================================================================
    // TOAST HELPER
    // =====================================================================
    function mostrarToast(msg, tipo = 'success') {
        const t = document.createElement('div');
        t.className = `factu-toast ${tipo}`;
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        t.innerHTML = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3800);
    }

});
