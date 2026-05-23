/**
 * cargaMasivaController.js (frontend)
 *
 * Flujo estricto "TODO O NADA":
 *   1. Parsear CSV del lado del cliente
 *   2. Validar TODAS las filas — si hay 1 error → abortar, mostrar fila exacta
 *   3. Si 0 errores → mostrar modal de confirmación con preview
 *   4. Solo al confirmar → insertar via ClienteModel / ProductoModel
 */
document.addEventListener('DOMContentLoaded', function () {

    // ── Plantillas descargables ───────────────────────────────────────────────
    const PLANTILLAS = {
        clientes:  'Nombre,Apellido,RUC_Cedula,Telefono,Email',
        productos: 'Codigo,Descripcion,Precio',
    };

    // Estado temporal del proceso en curso (para el modal de confirmación)
    let _pendiente = null;  // { entidad, registros, btnSubir, resEl }

    // ── Modal de confirmación (Bootstrap) ────────────────────────────────────
    const modalEl    = document.getElementById('modalConfirmarCarga');
    const modalBS    = new bootstrap.Modal(modalEl);
    const modalMsg   = document.getElementById('modalConfirmMsg');
    const modalPrev  = document.getElementById('modalPreview');
    const btnConfirm = document.getElementById('btnConfirmarCarga');

    btnConfirm.addEventListener('click', async () => {
        if (!_pendiente) return;
        modalBS.hide();
        await ejecutarCarga(_pendiente);
        _pendiente = null;
    });

    // Limpiar pendiente si el usuario cierra el modal sin confirmar
    modalEl.addEventListener('hidden.bs.modal', () => {
        if (_pendiente) {
            mostrarResultado(_pendiente.resEl, 'warning', '⚠️ Importación cancelada por el usuario.');
            _pendiente.btnSubir.disabled = false;
            resetBoton(_pendiente.btnSubir, _pendiente.entidad);
            _pendiente = null;
        }
    });

    // ── Inicializar secciones ─────────────────────────────────────────────────
    initSeccion('clientes',  { drop:'dropClientes',  input:'inputClientes',  status:'statusClientes',  nombre:'nameClientes',  btnSubir:'btnSubirClientes',  btnDl:'btnDlClientes',  res:'resClientes'  });
    initSeccion('productos', { drop:'dropProductos', input:'inputProductos', status:'statusProductos', nombre:'nameProductos', btnSubir:'btnSubirProductos', btnDl:'btnDlProductos', res:'resProductos' });

    lucide.createIcons();

    // ═══════════════════════════════════════════════════════════════════════════
    // FACTORY
    // ═══════════════════════════════════════════════════════════════════════════
    function initSeccion(entidad, ids) {
        const dropEl    = document.getElementById(ids.drop);
        const inputEl   = document.getElementById(ids.input);
        const statusEl  = document.getElementById(ids.status);
        const nombreEl  = document.getElementById(ids.nombre);
        const btnSubir  = document.getElementById(ids.btnSubir);
        const btnDl     = document.getElementById(ids.btnDl);
        const resEl     = document.getElementById(ids.res);
        let   archivo   = null;

        // Descarga plantilla
        btnDl.addEventListener('click', () => descargarPlantilla(entidad));

        // Click / teclado → abrir selector
        dropEl.addEventListener('click',   () => inputEl.click());
        dropEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') inputEl.click(); });

        // Drag & Drop
        dropEl.addEventListener('dragover',  (e) => { e.preventDefault(); dropEl.classList.add('dragover'); });
        dropEl.addEventListener('dragleave', ()  => dropEl.classList.remove('dragover'));
        dropEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dropEl.classList.remove('dragover');
            if (e.dataTransfer.files[0]) seleccionarArchivo(e.dataTransfer.files[0]);
        });

        inputEl.addEventListener('change', (e) => {
            if (e.target.files[0]) seleccionarArchivo(e.target.files[0]);
        });

        function seleccionarArchivo(file) {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                mostrarResultado(resEl, 'danger', '⚠️ Solo se aceptan archivos <strong>.CSV</strong>. Selecciona otro archivo.');
                return;
            }
            archivo = file;
            nombreEl.textContent = file.name;
            statusEl.classList.remove('d-none');
            resEl.innerHTML = '';
        }

        // Botón "Validar y Cargar"
        btnSubir.addEventListener('click', async () => {
            if (!archivo) return;

            btnSubir.disabled = true;
            btnSubir.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Validando...';
            resEl.innerHTML = '';

            try {
                const texto    = await leerArchivo(archivo);
                const registros = parsearCSV(texto);

                if (registros.length === 0) {
                    mostrarResultado(resEl, 'warning', '⚠️ El archivo no contiene filas de datos (solo cabeceras o vacío).');
                    btnSubir.disabled = false;
                    resetBoton(btnSubir, entidad);
                    return;
                }

                // ── FASE 1: Validación estructural "todo o nada" ──────────────
                const errores = validar(entidad, registros);

                if (errores.length > 0) {
                    // Abortar — mostrar el primer error con número de fila exacto
                    const lista = errores.map(e => `<li>${e}</li>`).join('');
                    mostrarResultado(resEl, 'danger',
                        `<strong><i data-lucide="x-circle" style="width:15px;" class="me-1"></i>Validación fallida — no se guardó ningún dato.</strong>
                         <ul class="mt-2 mb-0 ps-3">${lista}</ul>
                         <div class="mt-2 text-muted">Corrige el archivo y vuelve a intentarlo.</div>`
                    );
                    btnSubir.disabled = false;
                    resetBoton(btnSubir, entidad);
                    return;
                }

                // ── FASE 2: Confirmación ──────────────────────────────────────
                _pendiente = { entidad, registros, btnSubir, resEl, archivo, inputEl, statusEl };
                abrirConfirmacion(entidad, registros);

            } catch (err) {
                mostrarResultado(resEl, 'danger', `⚠️ No se pudo leer el archivo: ${err.message}`);
                btnSubir.disabled = false;
                resetBoton(btnSubir, entidad);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARSEO DE CSV (lado cliente)
    // ═══════════════════════════════════════════════════════════════════════════
    function leerArchivo(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error al leer el archivo.'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    function parsearCSV(texto) {
        // Elimina BOM si viene de Excel
        const limpio = texto.replace(/^\uFEFF/, '').trim();
        const lineas = limpio.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lineas.length < 2) return [];

        const cabeceras = lineas[0].split(',').map(h => h.trim());
        const registros = [];

        for (let i = 1; i < lineas.length; i++) {
            const valores = lineas[i].split(',').map(v => v.trim());
            const fila = {};
            cabeceras.forEach((h, idx) => { fila[h] = valores[idx] ?? ''; });
            fila._fila = i + 1; // número de fila en el archivo (con cabecera como fila 1)
            registros.push(fila);
        }

        return registros;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDACIÓN ESTRUCTURAL
    // ═══════════════════════════════════════════════════════════════════════════
    function validar(entidad, registros) {
        const errores = [];

        registros.forEach((row) => {
            const n = row._fila;

            if (entidad === 'clientes') {
                if (!row.Nombre || row.Nombre.length < 2)
                    errores.push(`Fila ${n}: El campo "Nombre" está vacío o es demasiado corto.`);
                if (!row.Apellido || row.Apellido.length < 2)
                    errores.push(`Fila ${n}: El campo "Apellido" está vacío o es demasiado corto.`);
                if (!row.RUC_Cedula || row.RUC_Cedula.trim() === '')
                    errores.push(`Fila ${n}: El campo "RUC_Cedula" está vacío.`);
                else if (!/^\d{10}$/.test(row.RUC_Cedula) && !/^\d{13}$/.test(row.RUC_Cedula))
                    errores.push(`Fila ${n}: "RUC_Cedula" debe ser una cédula de 10 dígitos o RUC de 13 dígitos (valor: "${row.RUC_Cedula}").`);
                if (row.Email && row.Email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email))
                    errores.push(`Fila ${n}: El campo "Email" no tiene un formato válido (valor: "${row.Email}").`);
            }

            if (entidad === 'productos') {
                if (!row.Codigo || row.Codigo.trim() === '')
                    errores.push(`Fila ${n}: El campo "Codigo" está vacío.`);
                if (!row.Descripcion || row.Descripcion.trim() === '')
                    errores.push(`Fila ${n}: El campo "Descripcion" está vacío.`);
                if (!row.Precio || row.Precio.trim() === '')
                    errores.push(`Fila ${n}: El campo "Precio" está vacío.`);
                else if (isNaN(parseFloat(row.Precio)) || parseFloat(row.Precio) <= 0)
                    errores.push(`Fila ${n}: "Precio" debe ser un número mayor a 0 (valor: "${row.Precio}").`);
            }
        });

        return errores;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL DE CONFIRMACIÓN CON PREVIEW
    // ═══════════════════════════════════════════════════════════════════════════
    function abrirConfirmacion(entidad, registros) {
        const etiqueta = entidad === 'clientes' ? 'clientes' : 'productos';
        modalMsg.innerHTML = `
            Se encontraron <strong>${registros.length} ${etiqueta}</strong> válidos en el archivo.<br>
            <span class="text-muted">Una vez confirmado, todos serán guardados en la base de datos.</span>`;

        // Preview: primeras 5 filas
        const preview = registros.slice(0, 5).map((r, i) => {
            const campos = Object.entries(r)
                .filter(([k]) => k !== '_fila')
                .map(([k, v]) => `<span class="text-muted">${k}:</span> ${v}`)
                .join(' &nbsp;|&nbsp; ');
            return `<div class="py-1 border-bottom">${i + 1}. ${campos}</div>`;
        }).join('');

        modalPrev.innerHTML = preview + (registros.length > 5
            ? `<div class="text-muted pt-1">… y ${registros.length - 5} más.</div>`
            : '');

        lucide.createIcons();
        modalBS.show();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EJECUCIÓN DE CARGA (solo tras confirmar)
    // ═══════════════════════════════════════════════════════════════════════════
    async function ejecutarCarga({ entidad, registros, btnSubir, resEl, archivo, inputEl, statusEl }) {
        btnSubir.disabled = true;
        btnSubir.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

        let guardados = 0;
        const fallosGuardo = [];

        for (let i = 0; i < registros.length; i++) {
            const row = registros[i];
            try {
                if (entidad === 'clientes') {
                    await ClienteModel.create({
                        nombre:   row.Nombre,
                        apellido: row.Apellido,
                        ruc:      row.RUC_Cedula,
                        tel:      row.Telefono || '',
                        email:    row.Email || '',
                    });
                } else {
                    await ProductoModel.create({
                        codigo:      row.Codigo,
                        descripcion: row.Descripcion,
                        precio:      parseFloat(row.Precio),
                    });
                }
                guardados++;
            } catch (err) {
                fallosGuardo.push(`Fila ${row._fila}: ${err.message}`);
            }
        }

        // ── Resultado final ───────────────────────────────────────────────────
        if (fallosGuardo.length === 0) {
            mostrarResultado(resEl, 'success',
                `<i data-lucide="check-circle" style="width:16px;" class="me-1"></i>
                 <strong>${guardados}</strong> registro(s) importados con éxito.`
            );
        } else {
            const lista = fallosGuardo.map(e => `<li>${e}</li>`).join('');
            mostrarResultado(resEl, 'warning',
                `<strong>${guardados} de ${registros.length}</strong> registros guardados.
                 <br><span class="text-muted small">Errores al guardar:</span>
                 <ul class="mt-1 mb-0 ps-3 small">${lista}</ul>`
            );
        }

        // Reset UI
        archivo   = null;
        inputEl.value = '';
        statusEl.classList.add('d-none');
        btnSubir.disabled = false;
        resetBoton(btnSubir, entidad);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════
    function descargarPlantilla(entidad) {
        const bom  = '\uFEFF';
        const blob = new Blob([bom + PLANTILLAS[entidad] + '\n'], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), { href: url, download: `plantilla_${entidad}.csv` });
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
    }

    function resetBoton(btn, entidad) {
        btn.innerHTML = '<i data-lucide="check-circle" class="me-2" style="width:16px;"></i>Validar y Cargar';
        lucide.createIcons();
    }

    function mostrarResultado(el, tipo, html) {
        el.innerHTML = `<div class="alert alert-${tipo} small py-3" role="alert">${html}</div>`;
        lucide.createIcons();
    }
});
