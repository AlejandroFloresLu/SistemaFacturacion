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
                    // Al cambiar manualmente a Nota de Crédito: limpiar datos actuales
                    contenedorVinculacionNC.classList.remove('d-none');
                    // Limpiar cliente/productos/pagos, pero mantener el tipo NC
                    limpiarFormulario(true);
                    clearActive();
                    modoNCActivo = false; // NC mode activo sólo después de cargar factura vinculada
                    // Modo NC: ocultar Aprobar, mostrar solo Anular y ocultar búsquedas
                    actualizarBotonesSegunTipo('nc');
                } else {
                    // Al cambiar a Factura: limpiar todo y restablecer a factura
                    contenedorVinculacionNC.classList.add('d-none');
                    facturaVinculada.value = '';
                    // Limpiar datos (cliente, productos, pagos) y forzar modo factura
                    modoNCActivo = false;
                    limpiarFormulario(false);
                    clearActive();
                    // Modo Factura: mostrar Aprobar, ocultar Anular
                    actualizarBotonesSegunTipo('factura');
                }
                if (invoiceLines.length > 0) calculateTotals();
            }
        });
    });
    if (facturaVinculada) facturaVinculada.addEventListener('input', calculateTotals);

    // Botón buscar factura vinculada (Nota de Crédito)
    // Demo de facturas vinculadas — via FacturaModel (con caché)
    // Los datos se obtienen bajo demanda en procesarBusquedaNC()

    const btnBuscarNC = contenedorVinculacionNC ? contenedorVinculacionNC.querySelector('button') : null;
    async function procesarBusquedaNC() {
        if (!facturaVinculada) return;
        const cod = facturaVinculada.value.trim().toUpperCase();
        if (!cod) {
            mostrarToast('⚠️ Ingresa el número de la factura original.', 'danger');
            facturaVinculada.focus();
            return;
        }

        try {
            const fac = await FacturaModel.getById(cod);
            if (fac) {
                _clienteIdBD = fac.clienteId || null;
                setCliente(fac.cliente, fac.ruc);
                invoiceLines = (fac.detalles || []).map(d => ({
                    id:    d.codigo,
                    desc:  d.codigo,
                    price: d.precio,
                    qty:   d.cantidad,
                    total: d.subtotal
                }));
                payments = [];
                renderLines();
                renderPayments();
                modoNCActivo = true;
                actualizarBotonesSegunTipo('nc');
                saveActive();
                mostrarToast('✅ Factura ' + cod + ' cargada. Revisa los datos y presiona Anular.', 'success');
            } else {
                mostrarToast('🔍 No se encontró la factura "' + cod + '". Verifica el número.', 'info');
            }
        } catch {
            mostrarToast('🔍 No se encontró la factura "' + cod + '". Verifica el número.', 'info');
        }
    }
    if (btnBuscarNC) {
        btnBuscarNC.addEventListener('click', procesarBusquedaNC);
    }
    if (facturaVinculada) {
        facturaVinculada.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); procesarBusquedaNC(); }
        });
    }

    // =====================================================================
    // ESTADO GLOBAL
    // =====================================================================
    const IVA_RATE   = 0.15;
    const LS_ACTIVE  = 'factu_active_invoice';
    const LS_PAUSED  = 'factu_paused_invoices';

    let invoiceLines  = [];
    let payments      = [];
    let clienteActual = null;   // { nombre, ruc }
    let pausedList    = [];
    let modoNCActivo  = false;  // true cuando se cargó una NC desde FAC-XXXXXX

    // ── Helper: alternar botones Aprobar ↔ Anular según tipo ──
    function actualizarBotonesSegunTipo(tipo) {
        const btnPagarEl  = document.getElementById('btnPagar');
        const btnAnularEl = document.getElementById('btnAnularNC');
        const btnPausarEl = document.getElementById('btnPausarFactura');
        const btnBuscarDeNuevoEl = document.getElementById('btnBuscarDeNuevo');
        const btnEscapeEl = document.getElementById('btnEscape');
        const paymentMethodEl = document.getElementById('paymentMethod');
        const vistaBusquedaClienteEl = document.getElementById('vistaBusquedaCliente');
        const panelClienteNoEncontradoEl = document.getElementById('panelClienteNoEncontrado');
        const spotlightEl = document.getElementById('spotlightProduct');
        const btnBuscarProductoIconEl = document.getElementById('btnBuscarProductoIcon');

        if (tipo === 'nc') {
            // Botones principales
            if (btnPagarEl)  btnPagarEl.classList.add('d-none');
            if (btnPausarEl) btnPausarEl.classList.add('d-none');
            if (btnAnularEl) btnAnularEl.classList.remove('d-none');
            // Cliente: ocultar búsqueda y opciones de reintento
            if (btnBuscarDeNuevoEl) btnBuscarDeNuevoEl.disabled = true;
            if (btnEscapeEl) btnEscapeEl.classList.add('d-none');
            if (vistaBusquedaClienteEl) vistaBusquedaClienteEl.classList.add('d-none');
            if (panelClienteNoEncontradoEl) panelClienteNoEncontradoEl.classList.add('d-none');
            // Productos: ocultar búsqueda/añadir
            if (spotlightEl) spotlightEl.classList.add('d-none');
            if (btnBuscarProductoIconEl) btnBuscarProductoIconEl.classList.add('d-none');
            // Pagos: deshabilitar edición
            if (paymentMethodEl) paymentMethodEl.disabled = true;
            if (amountInput) amountInput.disabled = true;
            if (btnAddPayment) btnAddPayment.disabled = true;
        } else {
            // Restaurar comportamiento normal
            if (btnPagarEl)  btnPagarEl.classList.remove('d-none');
            if (btnPausarEl) btnPausarEl.classList.remove('d-none');
            if (btnAnularEl) btnAnularEl.classList.add('d-none');
            if (btnBuscarDeNuevoEl) btnBuscarDeNuevoEl.disabled = false;
            if (btnEscapeEl) btnEscapeEl.classList.remove('d-none');
            if (vistaBusquedaClienteEl && !clienteActual) vistaBusquedaClienteEl.classList.remove('d-none');
            if (panelClienteNoEncontradoEl) panelClienteNoEncontradoEl.classList.add('d-none');
            if (spotlightEl) spotlightEl.classList.remove('d-none');
            if (btnBuscarProductoIconEl) btnBuscarProductoIconEl.classList.remove('d-none');
            if (paymentMethodEl) paymentMethodEl.disabled = false;
            if (amountInput) amountInput.disabled = false;
            if (btnAddPayment && invoiceLines.length > 0) btnAddPayment.disabled = false;
        }
    }

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

        // Mantener modo NC si el estado guardado indica NC
        modoNCActivo = tipoActual === 'nc';

        if (clienteActual) {
            setCliente(clienteActual.nombre, clienteActual.ruc, false);
        }
        if (tipoActual === 'nc') {
            contenedorVinculacionNC.classList.remove('d-none');
            document.getElementById('radioNC').checked = true;
        }

        // Asegurar que el estado de UI (botones, búsqueda, pagos) se aplique
        actualizarBotonesSegunTipo(tipoActual);

        if (invoiceLines.length > 0) {
            amountInput.disabled    = modoNCActivo;
            btnAddPayment.disabled  = modoNCActivo || false;
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
    // BÚSQL. Y CREACIÓN DE CLIENTES
    // =====================================================================
    // clienteId de BD para persistir la factura
    let _clienteIdBD = null;

    async function procesarBusquedaCliente() {
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

        // 4. Consumidor final (RUC especial)
        if (val === '9999999999') {
            _clienteIdBD = null;
            setCliente('Consumidor Final', '9999999999');
            return;
        }

        // 5. Buscar en la API
        try {
            const encontrado = await ClienteModel.findByRuc(val);
            if (encontrado) {
                _clienteIdBD = encontrado.id;
                setCliente(`${encontrado.nombre} ${encontrado.apellido}`, encontrado.ruc);
            } else {
                _clienteIdBD = null;
                txtRucNoEncontrado.innerText = val;
                vistaBusquedaCliente.classList.add('d-none');
                panelClienteNoEncontrado.classList.remove('d-none');
            }
        } catch {
            _clienteIdBD = null;
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

    document.getElementById('btnGuardarCliente').addEventListener('click', async () => {
        const nom   = document.getElementById('modalNombre').value.trim();
        const ape   = document.getElementById('modalApellido').value.trim();
        const ruc   = document.getElementById('modalRuc').value.trim();
        const pais  = document.getElementById('modalTelPais')?.value || '+593';
        const tel   = document.getElementById('modalTel')?.value.trim() || '';
        const email = document.getElementById('editCliEmail')?.value.trim() || '';
        if (!nom || !ape) { mostrarToast('⚠️ Nombre y apellido son obligatorios.', 'danger'); return; }
        try {
            const result = await ClienteModel.create({
                ruc, nombre: nom, apellido: ape,
                tel: tel ? pais + ' ' + tel : '',
                email
            });
            _clienteIdBD = result.id;
            setCliente(`${nom} ${ape}`, ruc);
            modalNuevoCliente.hide();
            mostrarToast(`✅ Cliente "${nom} ${ape}" creado y seleccionado.`, 'success');
        } catch (err) {
            mostrarToast(`⚠️ ${err.message}`, 'danger');
        }
    });

    btnEscape.addEventListener('click', () => {
        vistaClienteSeleccionado.classList.add('d-none');
        vistaBusquedaCliente.classList.remove('d-none');
        clienteActual = null;
        _clienteIdBD  = null;
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
    // PRODUCTOS — cargados desde API
    // =====================================================================
    let DB_PRODUCTS = [];

    // Carga dinámica de métodos de pago desde la BD
    async function cargarMetodosPago() {
        try {
            const res  = await fetch('/api/metodos-pago');
            const data = await res.json();
            methodSelect.innerHTML = '';
            const EMOJIS = { 'Efectivo': '💵', 'Tarjeta de Crédito': '💳', 'Tarjeta de Débito': '💳',
                             'Transferencia Bancaria': '🏦', 'Cheque': '✓' };
            data.forEach(m => {
                const opt = document.createElement('option');
                opt.value       = m.id;          // idMetodo numérico
                opt.textContent = `${m.nombre} ${EMOJIS[m.nombre] || ''}`;
                methodSelect.appendChild(opt);
            });
        } catch {
            // Fallback hardcoded si la BD no responde
            methodSelect.innerHTML = `
                <option value="1">Efectivo 💵</option>
                <option value="2">Tarjeta de Crédito 💳</option>
                <option value="3">Tarjeta de Débito 💳</option>
                <option value="4">Transferencia Bancaria 🏦</option>
                <option value="5">Cheque ✓</option>`;
        }
    }
    cargarMetodosPago();

    function cargarProductos() {
        ProductoModel.getAll().then(data => {
            DB_PRODUCTS = data;
            const datalistProductos = document.getElementById('productosList');
            if (datalistProductos) {
                datalistProductos.innerHTML = '';
                DB_PRODUCTS.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.desc;
                    opt.textContent = p.id + ' - $' + p.price.toFixed(2);
                    datalistProductos.appendChild(opt);
                });
            }
        });
    }
    cargarProductos();

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
        // En modo Nota de Crédito, no permitir eliminar productos
        if (modoNCActivo) {
            mostrarToast('⚠️ En Nota de Crédito no se pueden eliminar productos. Solo puedes cancelar o anular.', 'info');
            return;
        }
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
            mostrarToast('🗑️ Producto eliminado. Los pagos han sido reiniciados.', 'info');
        }
    };

    window.updateQty = function(id, qtyStr) {
        let qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0) return;
        if (qty > 1000000) {
            qty = 1000000;
            mostrarToast('⚠️ La cantidad máxima permitida es 1,000,000.', 'info');
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
                const btnEliminarDisabled = modoNCActivo ? 'disabled' : '';
                const titleEliminar = modoNCActivo ? 'No se puede eliminar en Nota de Crédito' : 'Quitar producto';
                tr.innerHTML = `
                    <td class="fw-bold align-middle">
                        <button class="btn btn-sm btn-light text-danger border-0 p-1 me-2" onclick="removeProduct('${line.id}')" ${btnEliminarDisabled}
                            title="${titleEliminar}" aria-label="Quitar ${line.desc}">
                            <i data-lucide="trash-2" style="width:16px;height:16px;" aria-hidden="true"></i>
                        </button>
                        ${line.desc}
                    </td>
                    <td class="text-center align-middle" style="width:100px;">
                        <input type="number" class="form-control form-control-sm text-center" value="${line.qty}" min="0" max="999999"
                            inputmode="numeric" ${modoNCActivo ? 'readonly' : ''}
                            onkeydown="if(['e','E','+','-','.'].includes(event.key)) event.preventDefault();"
                            oninput="var v=parseInt(this.value);if(isNaN(v)||v<1)this.value='1';if(this.value.replace(/[^0-9]/g,'').length>6){this.value=this.value.slice(0,this.value.length-1);}"
                            onchange="updateQty('${line.id}', this.value)"
                            aria-label="Cantidad de ${line.desc}">
                    </td>
                    <td class="text-end align-middle px-3" style="width:130px;">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white border-end-0 text-muted px-2" aria-hidden="true">$</span>
                            <input type="number" class="form-control border-start-0 ps-0 text-end" value="${line.price.toFixed(2)}" min="0.01" max="99999999.99" step="0.01"
                                inputmode="decimal" ${modoNCActivo ? 'readonly' : ''}
                                onkeydown="if(['e','E','+','-'].includes(event.key)) event.preventDefault();"
                                oninput="var p=parseFloat(this.value);if(!isNaN(p)&&p>99999999.99)this.value='99999999.99';if(!isNaN(p)&&p<0)this.value='0.01';"
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
        const idMetodo = parseInt(methodSelect.value, 10);
        const metodo   = methodSelect.options[methodSelect.selectedIndex].text;
        const v        = parseFloat(amountInput.value);

        // Validación 1: monto positivo
        if (isNaN(v) || v <= 0) {
            mostrarToast('⚠️ El monto a pagar debe ser mayor a 0.', 'danger');
            amountInput.focus();
            return;
        }

        // Validación 2: método de pago duplicado
        if (payments.find(p => p.idMetodo === idMetodo)) {
            mostrarToast(`⚠️ Ya existe un pago con "${metodo.trim()}". Elimínalo primero si quieres modificarlo.`, 'danger');
            return;
        }

        // Validación 3: monto no puede superar el saldo restante
        const totalActual = invoiceLines.reduce((a, c) => a + c.total, 0) * (1 + IVA_RATE);
        const saldoActual = totalActual - getPagado();
        if (v > saldoActual + 0.001) {
            mostrarToast(`⚠️ El monto ($${v.toFixed(2)}) supera el saldo restante ($${saldoActual.toFixed(2)}).`, 'danger');
            amountInput.focus();
            return;
        }

        payments.push({ id: Date.now(), idMetodo, method: metodo.trim(), amount: v });
        renderPayments();
        calculateTotals();
        saveActive();
    });

    window.removePayment = function(id) {
        // En modo Nota de Crédito, no permitir eliminar pagos
        if (modoNCActivo) {
            mostrarToast('⚠️ En Nota de Crédito no se pueden modificar los pagos.', 'info');
            return;
        }
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
            const btnEliminarPagoDisabled = modoNCActivo ? 'disabled' : '';
            li.innerHTML = `
                <span><i data-lucide="check-circle" class="text-success me-2" style="width:14px;height:14px;" aria-hidden="true"></i>${p.method}</span>
                <span>
                    <span class="fw-bold me-3" aria-label="Monto $${p.amount.toFixed(2)}">$${p.amount.toFixed(2)}</span>
                    <button class="btn btn-sm text-danger p-0 border-0" onclick="removePayment(${p.id})" ${btnEliminarPagoDisabled} aria-label="Quitar pago de ${p.method}">
                        <i data-lucide="x" style="width:16px;height:16px;" aria-hidden="true"></i>
                    </button>
                </span>`;
            paymentList.appendChild(li);
        });
        lucide.createIcons();
    }

    // =====================================================================
    // LIMPIAR FORMULARIO (utilidad interna)
    // keepTipo=true: no resetea el selector de tipo (usar en NC cancelar)
    // =====================================================================
    function limpiarFormulario(keepTipo = false) {
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

        if (!keepTipo) {
            // Solo resetea a Factura si NO se está en modo NC
            tipoActual = 'factura';
            document.getElementById('radioFactura').checked = true;
            contenedorVinculacionNC.classList.add('d-none');
            if (facturaVinculada) facturaVinculada.value = '';
            actualizarBotonesSegunTipo('factura');
        } else {
            // Mantiene el tipo (NC), pero limpia el campo de factura vinculada
            if (facturaVinculada) facturaVinculada.value = '';
        }

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
                                <div style="font-size:2.5rem;">\u{1F5D1}\uFE0F</div>
                                <h5 class="fw-bold text-dark mb-1 mt-2" id="modalCancelarLbl">\u00BFDescartar datos?</h5>
                                <p class="text-muted small mb-3">Se limpiarán los datos del formulario actual.</p>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-light fw-bold flex-grow-1" data-bs-dismiss="modal" aria-label="Mantener factura">Volver</button>
                                    <button class="btn btn-danger fw-bold flex-grow-1" id="btnConfirmarCancelar" aria-label="Confirmar descarte">Sí, limpiar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.body.appendChild(m.firstElementChild);
                document.getElementById('btnConfirmarCancelar').addEventListener('click', () => {
                    bootstrap.Modal.getInstance(document.getElementById('modalCancelarFactura')).hide();
                    clearActive();
                    // En modo NC: limpiar datos pero quedar en NC (keepTipo=true)
                    const esNC = tipoActual === 'nc';
                    modoNCActivo = false;
                    limpiarFormulario(esNC);
                    mostrarToast(esNC ? '\u{1F5D1}\uFE0F Nota de crédito cancelada' : '\u{1F5D1}\uFE0F Factura descartada', 'danger');
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
        // Restaurar UI según tipo guardado
        modoNCActivo = tipoActual === 'nc';
        if (tipoActual === 'nc') {
            contenedorVinculacionNC.classList.remove('d-none');
            document.getElementById('radioNC').checked = true;
        } else {
            contenedorVinculacionNC.classList.add('d-none');
            document.getElementById('radioFactura').checked = true;
        }
        // Reaplicar bloqueos/visibilidad según el tipo
        actualizarBotonesSegunTipo(tipoActual);
        if (invoiceLines.length > 0) {
            amountInput.disabled   = modoNCActivo;
            btnAddPayment.disabled = modoNCActivo ? true : false;
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

    document.getElementById('btnConfirmarAprobacion').addEventListener('click', async () => {
        const btnConfirmar = document.getElementById('btnConfirmarAprobacion');
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

        try {
            // Obtener el siguiente código de factura desde la API
            const codigoFactura = await FacturaModel.siguienteCodigo();

            // Resolver el id del cliente (consumidor final usa id=1 si existe, sino null)
            let clienteId = _clienteIdBD;
            if (!clienteId && clienteActual?.ruc === '9999999999') {
                // Buscar o usar el id del consumidor final en BD
                const cf = await ClienteModel.findByRuc('9999999999').catch(() => null);
                clienteId = cf?.id || null;
            }

            const IVA_RATE_LOCAL = 0.15;
            const subtotal = invoiceLines.reduce((acc, cur) => acc + cur.total, 0);
            const ivaTotal = subtotal * IVA_RATE_LOCAL;
            const total    = subtotal + ivaTotal;

            const payload = {
                clienteId:     clienteId,
                codigoFactura: codigoFactura,
                ivaTotal:      parseFloat(ivaTotal.toFixed(2)),
                total:         parseFloat(total.toFixed(2)),
                items: invoiceLines.map(line => ({
                    codigo:   line.id,
                    cantidad: line.qty,
                    precio:   parseFloat(line.price.toFixed(2)),
                    iva:      IVA_RATE_LOCAL * 100,
                    cantIva:  parseFloat((line.total * IVA_RATE_LOCAL).toFixed(2)),
                    subtotal: parseFloat(line.total.toFixed(2)),
                    total:    parseFloat((line.total * (1 + IVA_RATE_LOCAL)).toFixed(2)),
                })),
                // ── Bug fix: incluir pagos con idMetodo numérico (no solo texto) ──
                pagos: payments.map(p => ({
                    idMetodo:   p.idMetodo,
                    monto:      parseFloat(p.amount.toFixed(2)),
                    referencia: p.referencia || null,
                }))
            };

            await FacturaModel.create(payload);

            bootstrap.Modal.getInstance(document.getElementById('modalAprobarFactura')).hide();
            clearActive();
            limpiarFormulario();
            mostrarToast(`✅ Factura ${codigoFactura} emitida y guardada en la base de datos.`, 'success');

            // Abrir vista previa de impresión con los datos reales de la BD
            setTimeout(async () => {
                try {
                    const facturaCompleta = await FacturaModel.getById(codigoFactura);
                    _abrirImpresionFactura(facturaCompleta);
                } catch {
                    // Si falla la carga del detalle, imprimir la página actual como fallback
                    window.print();
                }
            }, 400);
        } catch (err) {
            mostrarToast(`⚠️ ${err.message || 'Error al guardar la factura.'}`, 'danger');
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i data-lucide="printer" class="me-2" style="width:16px;"></i> Confirmar e Imprimir';
            lucide.createIcons();
        }
    });

    // =====================================================================
    // ANULAR NOTA DE CRÉDITO
    // =====================================================================
    const btnAnularNC = document.getElementById('btnAnularNC');
    if (btnAnularNC) {
        btnAnularNC.addEventListener('click', () => {
            if (invoiceLines.length === 0) {
                mostrarToast('⚠️ Carga primero la factura original para anularla.', 'danger');
                return;
            }
            // Mostrar modal de confirmación (en lugar de confirm())
            if (!document.getElementById('modalAnularNC')) {
                const m = document.createElement('div');
                m.innerHTML = `
                <div class="modal fade" id="modalAnularNC" tabindex="-1" aria-labelledby="modalAnularNCLbl" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-sm">
                        <div class="modal-content border-0 shadow-lg" style="border-radius:16px;">
                            <div class="modal-header border-0 bg-light" style="border-radius: var(--border-radius) var(--border-radius) 0 0;">
                                <h5 class="modal-title fw-bold text-dark d-flex align-items-center" id="modalAnularNCLbl">
                                    <i data-lucide="ban" class="me-2 text-danger" aria-hidden="true"></i> Confirmar Anulación
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4 text-center">
                                <i data-lucide="x-circle" style="width:64px;height:64px;" class="text-danger opacity-75 mb-3" aria-hidden="true"></i>
                                <h5 class="fw-bold text-dark mb-2">¿Confirmas la ANULACIÓN de la Nota de Crédito?</h5>
                                <p class="text-muted mb-4">Esta acción registrará la anulación en el sistema.</p>

                                <div class="bg-light rounded p-3 text-start mb-0">
                                    <div class="d-flex justify-content-between mb-2"><span class="text-muted small">Cliente:</span> <span class="fw-bold" id="modalAnularCliente">-</span></div>
                                    <div class="d-flex justify-content-between mb-2"><span class="text-muted small">Productos/Servicios:</span> <span class="fw-bold" id="modalAnularItems">0</span></div>
                                    <div class="d-flex justify-content-between"><span class="text-muted small">TOTAL:</span> <span class="fw-bold text-primary" id="modalAnularTotal">$0.00</span></div>
                                </div>
                            </div>
                            <div class="modal-footer border-0 pt-0 pb-3 px-4">
                                <div class="d-flex gap-2 w-100">
                                    <button class="btn btn-light fw-bold flex-fill" data-bs-dismiss="modal">Cancelar</button>
                                    <button class="btn btn-danger fw-bold flex-fill" id="btnConfirmarAnularNC"><i data-lucide="ban" class="me-2"></i>Anular NC</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.body.appendChild(m.firstElementChild);
                lucide.createIcons();

                document.getElementById('btnConfirmarAnularNC').addEventListener('click', () => {
                    bootstrap.Modal.getInstance(document.getElementById('modalAnularNC')).hide();

                    modoNCActivo = false;
                    clearActive();
                    limpiarFormulario();
                    // Volver al modo Factura
                    document.getElementById('radioFactura').checked = true;
                    tipoActual = 'factura';
                    contenedorVinculacionNC.classList.add('d-none');
                    actualizarBotonesSegunTipo('factura');
                    mostrarToast('🚫 Nota de Crédito anulada correctamente.', 'success');
                });
            }

            // Rellenar datos del modal antes de mostrar
            const clienteTxt = clienteActual ? clienteActual.nombre : 'Consumidor Final (Defecto)';
            const itemsCount = invoiceLines.reduce((a, c) => a + c.qty, 0);
            const totalTxt = lblTotal ? lblTotal.innerText : '$0.00';
            const mc = document.getElementById('modalAnularCliente'); if (mc) mc.innerText = clienteTxt;
            const mi = document.getElementById('modalAnularItems'); if (mi) mi.innerText = itemsCount;
            const mt = document.getElementById('modalAnularTotal'); if (mt) mt.innerText = totalTxt;

            new bootstrap.Modal(document.getElementById('modalAnularNC')).show();
        });
    }


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

    // Re-aplicar bloqueos/ocultamientos cuando el usuario vuelve a la pestaña
    window.addEventListener('focus', () => {
        actualizarBotonesSegunTipo(tipoActual);
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') actualizarBotonesSegunTipo(tipoActual);
    });
    window.addEventListener('pageshow', () => {
        actualizarBotonesSegunTipo(tipoActual);
    });

});
