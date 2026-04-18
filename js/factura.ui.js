document.addEventListener("DOMContentLoaded", function() {

    // --- ELEMENTOS DEL DOM ---
    const spotlightInput = document.getElementById('spotlightProduct');
    const invoiceItems = document.getElementById('invoiceItems');
    const emptyRow = document.getElementById('emptyInvoiceRow');
    const btnPagar = document.getElementById('btnPagar');

    // Clientes
    const clienteSearch = document.getElementById('clienteSearch');
    const clienteBadge = document.getElementById('clienteBadge');
    const btnEscape = document.getElementById('btnEscape');
    const modalNuevoCliente = new bootstrap.Modal(document.getElementById('modalNuevoCliente'));

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

    // --- ESTADO GLOBALES ---
    let invoiceLines = [];
    let payments = [];
    const IVA_RATE = 0.15; // 15% IVA

    // --- 1. ATAJOS DE TECLADO (Cmd/Ctrl + K, F12) ---
    document.addEventListener('keydown', (e) => {
        // Cmd+K o Ctrl+K -> Spotlight
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault(); // Evitar comportamiento por defecto del navegador
            spotlightInput.focus();
        }
        
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

    // --- 2. BÚSQUEDA Y CREACIÓN DE CLIENTES ---
    clienteSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = clienteSearch.value.trim();
            if (val.length > 5) { // Simulación de búsqueda
                // Si el RUC es exacto al de prueba, lo halla. Sino, abre modal.
                if (val === '9999999999') {
                    setCliente('Consumidor Final', '9999999999');
                } else if (val === '1201201201') {
                    setCliente('Alejandro Flores', '1201201201');
                } else {
                    document.getElementById('modalRuc').value = val;
                    document.getElementById('modalNombre').value = '';
                    document.getElementById('modalApellido').value = '';
                    modalNuevoCliente.show();
                }
            }
        }
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
        clienteSearch.value = '';
        clienteSearch.disabled = false;
        clienteBadge.textContent = 'Sin cliente';
        clienteBadge.className = 'badge bg-secondary px-3 py-2 fs-6';
        btnEscape.classList.add('d-none');
        clienteSearch.focus();
    });

    function setCliente(name, ruc) {
        clienteSearch.value = `${name} - ${ruc}`;
        clienteSearch.disabled = true;
        clienteBadge.textContent = 'Cliente Activo';
        clienteBadge.className = 'badge bg-success px-3 py-2 fs-6';
        btnEscape.classList.remove('d-none');
        // Auto-focus al spotlight para agilidad
        spotlightInput.focus();
    }


    // --- 3. MÓDULO DE PRODUCTOS (SPOTLIGHT Y FAVORITOS) ---
    // Simulación de Base de Datos Local UI
    const DB_PRODUCTS = [
        { id: 1, desc: 'Tour Isla de Plata', price: 45.00 },
        { id: 2, desc: 'Boleto Ejecutivo VIP', price: 15.00 },
        { id: 3, desc: 'Vuelo Nacional UI-GYE', price: 120.00 },
        { id: 4, desc: 'Desayuno Buffet Adulto', price: 12.00 },
        { id: 5, desc: 'Paquete Galápagos 3D/2N', price: 450.00 },
        { id: 6, desc: 'Seguro de Viaje', price: 25.00 },
    ];

    spotlightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const term = spotlightInput.value.toLowerCase().trim();
            if(!term) return;

            // Busca primera coincidencia
            const matched = DB_PRODUCTS.find(p => p.desc.toLowerCase().includes(term) || p.id.toString() === term);
            
            if (matched) {
                window.addProduct(matched.id, matched.desc, matched.price);
            } else {
                // Producto manual
                window.addProduct(Date.now(), term, 10.00); 
            }
            spotlightInput.value = '';
        }
    });

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

    function renderLines() {
        if(invoiceLines.length === 0) {
            invoiceItems.innerHTML = `<tr id="emptyInvoiceRow"><td colspan="4" class="text-center text-muted py-5"><i data-lucide="inbox" class="mb-2 opacity-50" style="width: 48px; height: 48px;"></i><br>Agrega productos a la factura</td></tr>`;
        } else {
            invoiceItems.innerHTML = '';
            invoiceLines.forEach(line => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold align-middle">
                        <button class="btn btn-sm btn-light text-danger border-0 p-1 me-2" onclick="removeProduct(${line.id})" title="Quitar">
                            <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                        </button>
                        ${line.desc}
                    </td>
                    <td class="text-center align-middle">
                        <span class="badge bg-light text-dark border px-2 py-1 fs-6">${line.qty}</span>
                    </td>
                    <td class="text-end align-middle text-muted">$${line.price.toFixed(2)}</td>
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
        
        if (saldo <= 0 && invoiceLines.length > 0) {
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
                <span><i data-lucide="check-circle" class="text-success me-2" style="width:14px;height:14px;"></i>${p.method}</span>
                <span>
                    <span class="fw-bold me-3">$${p.amount.toFixed(2)}</span>
                    <button class="btn btn-sm text-danger p-0 border-0" onclick="removePayment(${p.id})"><i data-lucide="x" style="width:16px;height:16px;"></i></button>
                </span>
            `;
            paymentList.appendChild(li);
        });
        lucide.createIcons();
    }

});
