/**
 * productosController.js — Controlador de Productos
 * CRUD real conectado a la API REST via ProductoModel.
 */
document.addEventListener('DOMContentLoaded', function () {
    let DB_PRODUCTS = [];
    const catCounters = {};
    let _elimProdId = null;

    window.filtrarProductos = function (cat) {
        cat = cat || document.getElementById('filtroCategoria')?.value || 'ALL';
        const lista = cat === 'ALL' ? DB_PRODUCTS : DB_PRODUCTS.filter(p => p.id.startsWith(cat));
        const tbody = document.getElementById('productosBody');
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-5">Sin productos en esta categoría.</td></tr>`;
            return;
        }
        tbody.innerHTML = lista.map(p => {
            const prefix = p.id.split('-')[0];
            const badgeColor = { VUE:'#0b4182',ALO:'#15803d',TRA:'#92400e',PAQ:'#6d28d9',CRU:'#0e7490',SEG:'#b45309',TOU:'#065f46',ADM:'#991b1b' }[prefix]||'#374151';
            return `<tr>
                <td class="ps-4 py-3"><span class="badge me-2" style="background-color:${badgeColor};font-size:.7rem;">${p.id}</span><span class="fw-semibold">${p.desc}</span></td>
                <td class="text-end pe-4 py-3" style="min-width:130px;">
                    <div class="d-flex flex-column align-items-end gap-1">
                        <span class="fw-bold text-muted">$${p.price.toFixed(2)}</span>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary border-0 py-0 px-2" onclick="editarProducto('${p.id}')"><i data-lucide="edit-2" style="width:14px;height:14px;"></i></button>
                            <button class="btn btn-sm btn-outline-danger border-0 py-0 px-2" onclick="pedirEliminarProducto('${p.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                        </div>
                    </div>
                </td></tr>`;
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
        let codigo  = document.getElementById('nuevoProdCodigo').value.trim().toUpperCase();

        if (!desc) { mostrarToast('La descripción es obligatoria','danger'); return; }
        if (isNaN(price)||price<=0) { mostrarToast('El precio debe ser mayor a 0','danger'); return; }

        if (!codigo) {
            catCounters[cat] = (catCounters[cat]||DB_PRODUCTS.filter(p=>p.id.startsWith(cat)).length)+1;
            codigo = `${cat}-${String(catCounters[cat]).padStart(3,'0')}`;
        }

        try {
            await ProductoModel.create({ codigo, descripcion: desc, precio: price });
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoProducto')).hide();
            ['nuevoProdCodigo','nuevoProdDesc','nuevoProdPrecio'].forEach(id=>{ document.getElementById(id).value=''; });
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
        window.filtrarProductos(document.getElementById('filtroCategoria')?.value || 'ALL');
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
        window.filtrarProductos('ALL');
    }).catch(()=>mostrarToast('⚠️ No se pudo cargar los productos.','danger'));
});
