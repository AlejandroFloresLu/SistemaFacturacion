/**
 * productosController.js — Controlador de Productos
 * CRUD real conectado a la API REST via ProductoModel.
 */
document.addEventListener('DOMContentLoaded', function () {
    let DB_PRODUCTS = [];
    const catCounters = {};
    let _elimProdId = null;
    let prodPaginaActual = 1;
    const PROD_POR_PAGINA = 5;
    let prodFiltrados = [];

    window.filtrarProductos = function () {
        const cat = document.getElementById('filtroCategoria')?.value || 'ALL';
        const search = (document.getElementById('productoSearch')?.value || '').toLowerCase().trim();
        
        prodFiltrados = DB_PRODUCTS.filter(p => {
            const matchCat = cat === 'ALL' || p.id.startsWith(cat);
            const matchSearch = p.desc.toLowerCase().includes(search) || p.id.toLowerCase().includes(search);
            return matchCat && matchSearch;
        });
        
        prodPaginaActual = 1;
        renderProductos();
    };

    window.prodPagina = function (dir) {
        const tot = Math.ceil(prodFiltrados.length / PROD_POR_PAGINA);
        prodPaginaActual = Math.max(1, Math.min(prodPaginaActual + dir, tot));
        renderProductos();
    };

    function renderProductos() {
        const tbody = document.getElementById('productosBody');
        const inicio = (prodPaginaActual - 1) * PROD_POR_PAGINA;
        const pag = prodFiltrados.slice(inicio, inicio + PROD_POR_PAGINA);
        const tot = Math.ceil(prodFiltrados.length / PROD_POR_PAGINA) || 1;

        const elContador = document.getElementById('productosContador');
        if (elContador) elContador.textContent = `Mostrando ${prodFiltrados.length} de ${DB_PRODUCTS.length} productos`;
        
        const elNum = document.getElementById('prodPaginaNum');
        if (elNum) elNum.textContent = `${prodPaginaActual} / ${tot}`;
        
        const btnPrev = document.getElementById('prodPrev');
        if (btnPrev) btnPrev.disabled = prodPaginaActual <= 1;
        
        const btnNext = document.getElementById('prodNext');
        if (btnNext) btnNext.disabled = prodPaginaActual >= tot;

        if (pag.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5">Sin productos en esta categoría.</td></tr>`;
            return;
        }
        tbody.innerHTML = pag.map(p => {
            const prefix = p.id.split('-')[0];
            const badgeColor = { VUE:'#0b4182',ALO:'#15803d',TRA:'#92400e',PAQ:'#6d28d9',CRU:'#0e7490',SEG:'#b45309',TOU:'#065f46',ADM:'#991b1b' }[prefix]||'#374151';
            return `<tr>
                <td class="ps-4 py-3"><span class="badge" style="background-color:${badgeColor};font-size:.7rem;">${p.id}</span></td>
                <td class="py-3 fw-semibold">${p.desc}</td>
                <td class="text-end py-3 fw-bold text-muted">$${p.price.toFixed(2)}</td>
                <td class="text-end pe-4 py-3" style="min-width:100px;">
                    <div class="d-flex justify-content-end gap-1">
                        <button class="btn btn-sm btn-outline-primary border-0 py-0 px-2" onclick="editarProducto('${p.id}')"><i data-lucide="edit-2" style="width:14px;height:14px;"></i></button>
                        <button class="btn btn-sm btn-outline-danger border-0 py-0 px-2" onclick="pedirEliminarProducto('${p.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        lucide.createIcons();
    };

    window.editarProducto = function (id) {
        const p = DB_PRODUCTS.find(x => x.id === id);
        if (!p) return;
        document.getElementById('editProdId').value     = id;
        document.getElementById('editProdCodigo').value = p.id;
        document.getElementById('editProdDesc').value   = p.desc;
        document.getElementById('editProdPrecio').value = p.price.toFixed(2);
        new bootstrap.Modal(document.getElementById('modalEditarProducto')).show();
    };

    window.guardarEdicionProducto = async function () {
        const id    = document.getElementById('editProdId').value;
        const desc  = document.getElementById('editProdDesc').value.trim();
        const price = parseFloat(document.getElementById('editProdPrecio').value);
        if (!desc) { mostrarToast('La descripción no puede estar vacía','danger'); return; }
        if (isNaN(price)||price<=0) { mostrarToast('Precio inválido','danger'); return; }

        try {
            await ProductoModel.update(id, { descripcion: desc, precio: price });
            bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto')).hide();
            await recargarProductos();
            mostrarToast('✅ Producto editado con éxito','success');
        } catch (err) {
            mostrarToast(`⚠️ ${err.message}`, 'danger');
        }
    };

    window.pedirEliminarProducto = function (id) {
        _elimProdId = id;
        const p = DB_PRODUCTS.find(x => x.id === id);
        document.getElementById('elimProdNombre').textContent = p ? `${p.id} — ${p.desc}` : id;
        new bootstrap.Modal(document.getElementById('modalEliminarProducto')).show();
    };

    window.confirmarEliminarProducto = async function () {
        if (!_elimProdId) return;
        const id = _elimProdId; _elimProdId = null;
        bootstrap.Modal.getInstance(document.getElementById('modalEliminarProducto')).hide();
        try {
            await ProductoModel.remove(id);
            await recargarProductos();
            mostrarToast(`🗑️ Producto "${id}" eliminado`,'danger');
        } catch (err) {
            mostrarToast(`⚠️ ${err.message}`, 'danger');
        }
    };

    // ── Nuevo Producto ────────────────────────────────────────────────────────
    const btnGuardar = document.getElementById('btnGuardarProducto');
    if (btnGuardar) btnGuardar.addEventListener('click', async () => {
        const cat   = document.getElementById('nuevoProdCategoria').value;
        const desc  = document.getElementById('nuevoProdDesc').value.trim();
        const price = parseFloat(document.getElementById('nuevoProdPrecio').value);

        if (!desc) { mostrarToast('La descripción es obligatoria','danger'); return; }
        if (isNaN(price)||price<=0) { mostrarToast('El precio debe ser mayor a 0','danger'); return; }

        // Encontrar el último número para esta categoría
        const productosCat = DB_PRODUCTS.filter(p => p.id.startsWith(cat));
        let maxNum = 0;
        productosCat.forEach(p => {
            const numPart = parseInt(p.id.split('-')[1] || '0', 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        });
        
        const nuevoNum = maxNum + 1;
        const codigo = `${cat}-${String(nuevoNum).padStart(3, '0')}`;

        try {
            await ProductoModel.create({ codigo, descripcion: desc, precio: price });
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoProducto')).hide();
            ['nuevoProdDesc','nuevoProdPrecio'].forEach(id=>{ document.getElementById(id).value=''; });
            document.getElementById('filtroCategoria').value = cat;
            await recargarProductos();
            mostrarToast('✅ Producto añadido con éxito','success');
        } catch (err) {
            mostrarToast(`⚠️ ${err.message}`, 'danger');
        }
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    async function recargarProductos() {
        ProductoModel.clearCache();
        DB_PRODUCTS = await ProductoModel.getAll();
        poblarCategorias();
        window.filtrarProductos();
    }

    function poblarCategorias() {
        const select = document.getElementById('filtroCategoria');
        if (!select) return;
        
        const valorActual = select.value;
        const categoriasUnicas = [...new Set(DB_PRODUCTS.map(p => p.id.split('-')[0]))].filter(Boolean).sort();
        
        select.innerHTML = '<option value="ALL">Todas las Categorías</option>';
        categoriasUnicas.forEach(cat => {
            const desc = { VUE:'Boletos Aéreos', ALO:'Alojamiento', TRA:'Transporte', PAQ:'Paquetes', CRU:'Cruceros', SEG:'Seguros', TOU:'Tours', ADM:'Administrativos' }[cat] || cat;
            select.innerHTML += `<option value="${cat}">${desc} (${cat})</option>`;
        });
        
        if (categoriasUnicas.includes(valorActual)) {
            select.value = valorActual;
        } else {
            select.value = 'ALL';
        }
    }

    function mostrarToast(msg, tipo='success') {
        const t = document.createElement('div');
        t.className=`factu-toast ${tipo}`; t.innerHTML=msg;
        document.body.appendChild(t);
        setTimeout(()=>t.remove(),3500);
    }

    // ── Arranque ──────────────────────────────────────────────────────────────
    lucide.createIcons();
    ProductoModel.getAll().then(data => {
        DB_PRODUCTS = data;
        poblarCategorias();
        window.filtrarProductos();
    }).catch(()=>mostrarToast('⚠️ No se pudo cargar los productos.','danger'));
});
