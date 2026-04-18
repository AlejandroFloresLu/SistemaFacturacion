document.addEventListener("DOMContentLoaded", function() {

    // --- ELEMENTOS DEL DOM ---
    const spotlightInput = document.getElementById('spotlightProduct');
    const invoiceItems = document.getElementById('invoiceItems');
    const btnPagar = document.getElementById('btnPagar');

    // Inicializar Fecha
    const fechaEmision = document.getElementById('fechaEmision');
    if(fechaEmision) {
        const today = new Date();
        fechaEmision.innerText = today.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    // Clientes
    const clienteSearch = document.getElementById('clienteSearch');
    const btnEscape = document.getElementById('btnEscape');
    const modalNuevoCliente = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));
    
    // Vistas Dinámicas Cliente
    const vistaBusquedaCliente = document.getElementById('vistaBusquedaCliente');
    const panelClienteNoEncontrado = document.getElementById('panelClienteNoEncontrado');
    const txtRucNoEncontrado = document.getElementById('txtRucNoEncontrado');
    const vistaClienteSeleccionado = document.getElementById('vistaClienteSeleccionado');
    const btnBuscarDeNuevo = document.getElementById('btnBuscarDeNuevo');
    const btnCrearNuevoClienteDirecto = document.getElementById('btnCrearNuevoClienteDirecto');

    // Pagos y Totales
    const methodSelect = document.getElementById('paymentMethod');
    const amountInput = document.getElementById('paymentAmount');
    const btnAddPayment = document.getElementById('btnAddPayment');
    const paymentList = document.getElementById('paymentList');

    const lblSubtotal = document.getElementById('lblSubtotal');
    const lblIva = document.getElementById('lblIva');
    const lblTotal = document.getElementById('lblTotal');
    const lblPagado = document.getElementById('lblPagado');
    const lblSaldo = document.getElementById('lblSaldo');
    const containerSaldo = document.getElementById('containerSaldo'); // To change color
    
    // Tipo de Documento NC
    const radiosTipo = document.querySelectorAll('input[name="tipoComprobanteRadio"]');
    const contenedorVinculacionNC = document.getElementById('contenedorVinculacionNC');
    const facturaVinculada = document.getElementById('facturaVinculada');

    let tipoActual = 'factura';

    radiosTipo.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.checked) {
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

    // --- ESTADO GLOBALES ---
    let invoiceLines = [];
    let payments = [];
    const IVA_RATE = 0.15; // 15% IVA

    // --- 1. ATAJOS DE TECLADO (F12) ---
    document.addEventListener('keydown', (e) => {
        // F12 -> Aprobar Pago
        if (e.key === 'F12') {
            e.preventDefault();
            if (!btnPagar.disabled) {
                btnPagar.click();
            }
        }

        // Escape -> Cerrar cliente actual si está seleccionado
        if (e.key === 'Escape' && document.activeElement === document.body) {
            btnEscape.click();
        }
    });

    // --- FUNCIÓN VALIDADORA CÉDULA ECUADOR ---
    function validarCedulaEcuatoriana(cedula) {
        if (cedula.length !== 10 || !/^\d+$/.test(cedula)) return false;
        var region = parseInt(cedula.substring(0, 2), 10);
        if (region < 1 || region > 24) return false;
        var tercer_digito = parseInt(cedula.substring(2, 3), 10);
        if (tercer_digito > 5) return false;
        var suma = 0;
        for (var i = 0; i < 9; i++) {
            var valor = parseInt(cedula.charAt(i), 10);
            if (i % 2 === 0) { 
                valor = valor * 2;
                if (valor > 9) valor -= 9;
            }
            suma += valor;
        }
        var digito_verificador = parseInt(cedula.charAt(9), 10);
        var decena_superior = Math.ceil(suma / 10) * 10;
        var resultado = decena_superior - suma;
        if (resultado === 10) resultado = 0;
        return resultado === digito_verificador;
    }

    // --- 2. BÚSQUEDA Y CREACIÓN DE CLIENTES ---
    function procesarBusquedaCliente() {
        const val = clienteSearch.value.trim();
        if (!val) return;
        
        // RESTRICCIÓN: Solo 10 o 13 dígitos numéricos
        if (!/^\d+$/.test(val) || (val.length !== 10 && val.length !== 13)) {
            txtRucNoEncontrado.innerText = val === "" ? "Vacío" : val + " (Debe tener 10 o 13 números)";
            vistaBusquedaCliente.classList.add('d-none');
            panelClienteNoEncontrado.classList.remove('d-none');
            return;
        }

        // Si digita exactamente 10 números, validar algoritmo de Provincia
        if (val.length === 10 && val !== '9999999999') {
            if (!validarCedulaEcuatoriana(val)) {
                txtRucNoEncontrado.innerText = val + " (Cédula Inválida)";
                vistaBusquedaCliente.classList.add('d-none');
                panelClienteNoEncontrado.classList.remove('d-none');
                return;
            }
        }

        // Lógica de búsqueda visual de prueba
        if (val === '9999999999') {
            setCliente('Consumidor Final', '9999999999');
        } else if (val === '1201201201') {
            setCliente('Alejandro Flores', '1201201201');
        } else if (val === '1792929292001') {
            setCliente('Empresa Ficticia S.A.', '1792929292001');
        } else {
            // No se encontró
            txtRucNoEncontrado.innerText = val;
            vistaBusquedaCliente.classList.add('d-none');
            panelClienteNoEncontrado.classList.remove('d-none');
        }
    }

    clienteSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            procesarBusquedaCliente();
        }
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
        document.getElementById('modalNombre').value = '';
        document.getElementById('modalApellido').value = '';
        modalNuevoCliente.show();
    });

    document.getElementById('btnGuardarCliente').addEventListener('click', () => {
        const nom = document.getElementById('modalNombre').value;
        const ape = document.getElementById('modalApellido').value;
        const ruc = document.getElementById('modalRuc').value;
        if(nom) {
            setCliente(`${nom} ${ape}`, ruc);
            modalNuevoCliente.hide();
        }
    });

    btnEscape.addEventListener('click', () => {
        vistaClienteSeleccionado.classList.add('d-none');
        vistaBusquedaCliente.classList.remove('d-none');
        clienteSearch.value = '';
        clienteSearch.focus();
    });

    function setCliente(name, ruc) {
        vistaBusquedaCliente.classList.add('d-none');
        panelClienteNoEncontrado.classList.add('d-none');
        vistaClienteSeleccionado.classList.remove('d-none');

        document.getElementById('nombreClienteSeleccionado').innerText = name;
        document.getElementById('rucClienteSeleccionado').innerText = ruc;
        
        // Auto-focus al spotlight para agilidad
        spotlightInput.focus();
    }


    // --- 3. MÓDULO DE PRODUCTOS (SPOTLIGHT Y FAVORITOS) ---
    // Inventario Local Estricto
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
            const option = document.createElement('option');
            option.value = p.desc;
            option.textContent = p.id + ' - $' + p.price.toFixed(2);
            datalistProductos.appendChild(option);
        });
    }

    function procesarBusquedaProducto() {
        const term = spotlightInput.value.toLowerCase().trim();
        if(!term) return;

        // Busca coincidencia en inventario estrictamente
        const matched = DB_PRODUCTS.find(p => p.desc.toLowerCase().includes(term) || p.id.toLowerCase() === term);
        
        if (matched) {
            window.addProduct(matched.id, matched.desc, matched.price);
            spotlightInput.value = '';
        } else {
            alert("Producto no encontrado. Seleccione uno sugerido del inventario.");
        }
    }

    spotlightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            procesarBusquedaProducto();
        }
    });

    const btnBuscarProductoIcon = document.getElementById('btnBuscarProductoIcon');
    if (btnBuscarProductoIcon) btnBuscarProductoIcon.addEventListener('click', procesarBusquedaProducto);

    window.addProduct = function(id, desc, price) {
        // ¿Ya existe en la factura?
        const exist = invoiceLines.find(i => i.id === id);
        if (exist) {
            exist.qty += 1;
            exist.total = exist.qty * exist.price;
        } else {
            invoiceLines.push({ id, desc, price, qty: 1, total: price });
        }
        
        // Habilitar form de pago
        amountInput.disabled = false;
        btnAddPayment.disabled = false;

        renderLines();
    };

    window.removeProduct = function(id) {
        invoiceLines = invoiceLines.filter(i => i.id !== id);
        if (invoiceLines.length === 0) {
            amountInput.disabled = true;
            btnAddPayment.disabled = true;
        }
        renderLines();
    };

    window.updateQty = function(id, qtyStr) {
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0) return;
        const exist = invoiceLines.find(i => i.id === id);
        if (exist) {
            exist.qty = qty;
            exist.total = exist.qty * exist.price;
            calculateTotals();
            renderLines();
        }
    };

    window.updatePrice = function(id, priceStr) {
        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) return;
        const exist = invoiceLines.find(i => i.id === id);
        if (exist) {
            exist.price = price;
            exist.total = exist.qty * exist.price;
            calculateTotals();
            renderLines();
        }
    };

    function renderLines() {
        if(invoiceLines.length === 0) {
            invoiceItems.innerHTML = `<tr id="emptyInvoiceRow"><td colspan="4" class="text-center text-muted py-5"><i data-lucide="inbox" class="mb-2 opacity-50" style="width: 48px; height: 48px;"></i><br>Agrega productos a la factura</td></tr>`;
        } else {
            invoiceItems.innerHTML = '';
            invoiceLines.forEach(line => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold align-middle">
                        <button class="btn btn-sm btn-light text-danger border-0 p-1 me-2" onclick="removeProduct('${line.id}')" title="Quitar">
                            <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                        </button>
                        ${line.desc}
                    </td>
                    <td class="text-center align-middle" style="width: 100px;">
                        <input type="number" class="form-control form-control-sm text-center" value="${line.qty}" min="1" onkeydown="if(['e','E','+','-','.'].includes(event.key)) event.preventDefault();" onchange="updateQty('${line.id}', this.value)" title="Modificar Cantidad">
                    </td>
                    <td class="text-end align-middle px-3" style="width: 130px;">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-white border-end-0 text-muted px-2">$</span>
                            <input type="number" class="form-control border-start-0 ps-0 text-end" value="${line.price.toFixed(2)}" min="0.01" step="0.01" onkeydown="if(['e','E','+','-'].includes(event.key)) event.preventDefault();" onchange="updatePrice('${line.id}', this.value)" title="Modificar Precio">
                        </div>
                    </td>
                    <td class="text-end align-middle fw-bold">$${line.total.toFixed(2)}</td>
                `;
                invoiceItems.appendChild(tr);
            });
        }
        lucide.createIcons();
        calculateTotals();
    }

    // --- 4. CÁLCULO DE TOTALES Y VALIDACIÓN DE PAGO ---
    function calculateTotals() {
        const subtotal = invoiceLines.reduce((acc, current) => acc + current.total, 0);
        const iva = subtotal * IVA_RATE;
        const total = subtotal + iva;
        
        lblSubtotal.textContent = subtotal.toFixed(2);
        lblIva.textContent = iva.toFixed(2);
        lblTotal.textContent = total.toFixed(2);

        // Actualizar monto sugerido en el input si está vacío
        amountInput.value = (total - getPagado()).toFixed(2);
        
        validatePayments(total);
    }

    function getPagado() {
        return payments.reduce((acc, p) => acc + p.amount, 0);
    }

    function validatePayments(total) {
        const pagado = getPagado();
        const saldo = total - pagado;
        
        lblPagado.textContent = pagado.toFixed(2);
        
        let vinculacionOk = true;
        if (typeof tipoActual !== 'undefined' && tipoActual === 'nc' && facturaVinculada && facturaVinculada.value.trim() === '') {
            vinculacionOk = false;
        }

        if (saldo <= 0 && invoiceLines.length > 0 && vinculacionOk) {
            lblSaldo.textContent = '0.00';
            containerSaldo.style.color = '#15803d'; // Verde Exito
            btnPagar.disabled = false;
        } else {
            lblSaldo.textContent = saldo > 0 ? saldo.toFixed(2) : '0.00';
            containerSaldo.style.color = '#dc3545'; // Rojo Peligro
            btnPagar.disabled = true;
        }
    }

    // --- 5. PAGOS MIXTOS ---
    btnAddPayment.addEventListener('click', () => {
        const m = methodSelect.options[methodSelect.selectedIndex].text;
        const v = parseFloat(amountInput.value);
        if (isNaN(v) || v <= 0) return;

        payments.push({ id: Date.now(), method: m, amount: v });
        renderPayments();
        calculateTotals();
    });

    window.removePayment = function(id) {
        payments = payments.filter(p => p.id !== id);
        renderPayments();
        calculateTotals();
    };

    function renderPayments() {
        paymentList.innerHTML = '';
        payments.forEach(p => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-2';
            li.innerHTML = `
                <span><i data-lucide="check-circle" class="text-success me-2" style="width:14px;height:14px;" aria-hidden="true"></i>${p.method}</span>
                <span>
                    <span class="fw-bold me-3">$${p.amount.toFixed(2)}</span>
                    <button class="btn btn-sm text-danger p-0 border-0" onclick="removePayment(${p.id})" aria-label="Quitar pago"><i data-lucide="x" style="width:16px;height:16px;" aria-hidden="true"></i></button>
                </span>
            `;
            paymentList.appendChild(li);
        });
        lucide.createIcons();
    }

    // --- 6. POPULAR MODAL DE CONFIRMACIÓN ---
    btnPagar.addEventListener('click', () => {
        const nombreCliente = document.getElementById('vistaClienteSeleccionado').classList.contains('d-none') ? 'Consumidor Final (Defecto)' : document.getElementById('nombreClienteSeleccionado').innerText;
        document.getElementById('modalConfirmCliente').innerText = nombreCliente;
        const totalItems = invoiceLines.reduce((acc, curr) => acc + curr.qty, 0);
        document.getElementById('modalConfirmItems').innerText = totalItems;
        document.getElementById('modalConfirmTotal').innerText = lblTotal.innerText;
    });

    document.getElementById('btnConfirmarAprobacion').addEventListener('click', () => {
        alert("¡Factura Emitida Correctamente y enviada a impresión!");
        location.reload();
    });

});
