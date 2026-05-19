/**
 * cargaMasivaController.js (frontend) — Controlador de Carga Masiva
 * - Plantillas solo-cabecera (sin datos de ejemplo que confunden)
 * - Drag & drop + click en zona
 * - Validación previa antes de enviar al backend
 * - Muestra panel de resultados con errores fila por fila
 */
document.addEventListener('DOMContentLoaded', function () {

    // ── Plantillas: SOLO cabeceras, sin filas de datos ────────────────────────
    const PLANTILLAS = {
        productos: 'Codigo,Descripcion,Precio',
        clientes:  'Nombre,Apellido,RUC_Cedula,Telefono,Email',
        facturas:  'CodigoFactura,RUC_Cliente,CodigoProducto,Cantidad,Precio',
    };

    // ── Descargar plantilla vacía ─────────────────────────────────────────────
    window.descargarPlantilla = function (tipo) {
        const cabecera = PLANTILLAS[tipo];
        if (!cabecera) return;
        // BOM UTF-8 para que Excel abra correctamente con tildes
        const bom  = '\uFEFF';
        const blob = new Blob([bom + cabecera + '\n'], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `plantilla_${tipo}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        mostrarToast(`📥 Plantilla de ${tipo} descargada — solo contiene las cabeceras`, 'info');
    };

    // ── Drag & Drop para cada zona ────────────────────────────────────────────
    ['dropZoneProd', 'dropZoneCli', 'dropZoneFac'].forEach(id => {
        const zona = document.getElementById(id);
        if (!zona) return;
        zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('drag-over'); });
        zona.addEventListener('dragleave', ()  => zona.classList.remove('drag-over'));
        zona.addEventListener('drop', e => {
            e.preventDefault();
            zona.classList.remove('drag-over');
            const file = e.dataTransfer?.files?.[0];
            if (!file) return;
            const tipo   = id.includes('Prod') ? 'productos' : id.includes('Cli') ? 'clientes' : 'facturas';
            const nombre = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            _subirArchivo(file, id, nombre, tipo);
        });
    });

    // ── Entrada desde input file ──────────────────────────────────────────────
    window.procesarCarga = function (input, dropId, nombre, tipo) {
        if (!input.files?.[0]) return;
        _subirArchivo(input.files[0], dropId, nombre, tipo);
        input.value = '';
    };

    // ── Lógica principal de subida ────────────────────────────────────────────
    async function _subirArchivo(file, dropId, nombre, tipo) {
        // Validar extensión en frontend
        if (!file.name.toLowerCase().endsWith('.csv')) {
            mostrarToast('⚠️ Solo se aceptan archivos .CSV', 'danger');
            return;
        }

        const zona      = document.getElementById(dropId);
        const resultId  = 'result' + dropId.replace('dropZone', '');
        const resultDiv = document.getElementById(resultId);

        // UI de carga
        zona.innerHTML = _progressHTML(file.name);
        if (resultDiv) { resultDiv.className = 'result-panel'; resultDiv.innerHTML = ''; }
        lucide.createIcons();

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('tipo', tipo);

            const response = await fetch(`/api/carga/${tipo}`, {
                method: 'POST',
                body:   formData,
            });

            const result = await response.json();

            if (response.ok && result.ok) {
                // ── Éxito total ───────────────────────────────────────────────
                zona.innerHTML = _successZoneHTML();
                if (resultDiv) {
                    resultDiv.className = 'result-panel visible';
                    resultDiv.innerHTML = `
                        <div class="alert alert-success border-0 py-2 px-3 d-flex align-items-center gap-2 mt-2" style="border-radius:10px;">
                            <i data-lucide="check-circle-2" style="width:18px;min-width:18px;" aria-hidden="true"></i>
                            <div class="small">
                                <strong>${result.insertados}</strong> registros importados correctamente.
                            </div>
                        </div>`;
                }
                mostrarToast(`✅ ${nombre}: ${result.insertados} registros importados`, 'success');

            } else if (result.errores && result.errores.length > 0) {
                // ── Errores de validación ─────────────────────────────────────
                zona.innerHTML = _errorZoneHTML();
                if (resultDiv) {
                    resultDiv.className = 'result-panel visible';
                    const lista = result.errores.map(e =>
                        `<li class="py-1 border-bottom">${_escapeHTML(e)}</li>`
                    ).join('');
                    resultDiv.innerHTML = `
                        <div class="alert alert-danger border-0 py-2 px-3 mt-2" style="border-radius:10px;">
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <i data-lucide="alert-triangle" style="width:16px;min-width:16px;" aria-hidden="true"></i>
                                <strong class="small">Carga cancelada — ${result.errores.length} error(es) encontrado(s):</strong>
                            </div>
                            <ul class="list-unstyled mb-0 small error-list ps-1">${lista}</ul>
                        </div>`;
                }
                mostrarToast(`❌ Carga de ${nombre} abortada por errores de validación`, 'danger');

            } else {
                // ── Error genérico ────────────────────────────────────────────
                zona.innerHTML = _errorZoneHTML();
                if (resultDiv) {
                    resultDiv.className = 'result-panel visible';
                    resultDiv.innerHTML = `
                        <div class="alert alert-danger border-0 py-2 px-3 mt-2 small" style="border-radius:10px;">
                            ❌ ${_escapeHTML(result.error || 'Error desconocido en el servidor')}
                        </div>`;
                }
                mostrarToast(`⚠️ ${result.error || 'Error en la carga'}`, 'danger');
            }

        } catch {
            zona.innerHTML = _errorZoneHTML();
            if (resultDiv) {
                resultDiv.className = 'result-panel visible';
                resultDiv.innerHTML = `
                    <div class="alert alert-danger border-0 py-2 px-3 mt-2 small" style="border-radius:10px;">
                        ❌ No se pudo conectar con el servidor.
                    </div>`;
            }
            mostrarToast('⚠️ Error de red al subir el archivo', 'danger');
        }

        lucide.createIcons();

        // Restaurar zona de drop después de 8 segundos
        setTimeout(() => {
            zona.innerHTML = _defaultZoneHTML();
            if (resultDiv) { resultDiv.className = 'result-panel'; resultDiv.innerHTML = ''; }
            lucide.createIcons();
        }, 8000);
    }

    // ── Plantillas de HTML interno de zonas ───────────────────────────────────
    function _progressHTML(fileName) {
        return `
            <div class="w-100 px-2">
                <div class="d-flex align-items-center mb-2 gap-2">
                    <i data-lucide="file-check-2" style="width:18px;height:18px;" class="text-primary" aria-hidden="true"></i>
                    <span class="fw-bold small text-truncate" style="max-width:170px;">${_escapeHTML(fileName)}</span>
                </div>
                <div class="progress" style="height:7px;border-radius:8px;">
                    <div class="progress-bar bg-primary progress-bar-striped progress-bar-animated" style="width:70%"></div>
                </div>
                <div class="text-muted small mt-2">Validando y procesando...</div>
            </div>`;
    }

    function _successZoneHTML() {
        return `
            <i data-lucide="check-circle-2" style="width:36px;height:36px;" class="mb-2 text-success d-block" aria-hidden="true"></i>
            <span class="fw-bold small text-success d-block">¡Importación exitosa!</span>`;
    }

    function _errorZoneHTML() {
        return `
            <i data-lucide="alert-circle" style="width:36px;height:36px;" class="mb-2 text-danger d-block" aria-hidden="true"></i>
            <span class="fw-bold small text-danger d-block">Carga cancelada</span>
            <span class="small text-muted mt-1 opacity-75">Revisa los errores abajo</span>`;
    }

    function _defaultZoneHTML() {
        return `
            <i data-lucide="upload-cloud" style="width:36px;height:36px;" class="mb-2 text-primary opacity-60 d-block" aria-hidden="true"></i>
            <span class="fw-bold small text-dark d-block">Soltar archivo aquí</span>
            <span class="small text-muted mt-1 opacity-75">Solo .CSV</span>`;
    }

    function _escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Toast helper ──────────────────────────────────────────────────────────
    function mostrarToast(msg, tipo = 'success') {
        const t = document.createElement('div');
        t.className = `factu-toast ${tipo}`;
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        t.innerHTML = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 5500);
    }
});
