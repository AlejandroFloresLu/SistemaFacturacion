/**
 * cargaMasivaController.js (frontend) — Controlador de Carga Masiva
 * - Plantillas solo-cabecera
 * - Drag & drop unificado
 * - Envío a /api/carga con FormData
 */
document.addEventListener('DOMContentLoaded', function () {
    const PLANTILLAS = {
        productos: 'Codigo,Descripcion,Precio',
        clientes:  'Nombre,Apellido,RUC_Cedula,Telefono,Email',
        facturas:  'CodigoFactura,RUC_Cliente,CodigoProducto,Cantidad,Precio',
    };

    const entidadSelect = document.getElementById('entidadSelect');
    const btnDescargar = document.getElementById('btnDescargar');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const btnSubir = document.getElementById('btnSubir');
    const errorZone = document.getElementById('errorZone');
    const errorList = document.getElementById('errorList');
    const successZone = document.getElementById('successZone');
    const successMessage = document.getElementById('successMessage');

    let currentFile = null;

    // ── Descargar plantilla vacía ─────────────────────────────────────────────
    btnDescargar.addEventListener('click', () => {
        const tipo = entidadSelect.value;
        const cabecera = PLANTILLAS[tipo];
        if (!cabecera) return;
        
        // BOM UTF-8 para Excel
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
    });

    // ── Seleccionar archivo (Click) ───────────────────────────────────────────
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // ── Seleccionar archivo (Drag & Drop) ─────────────────────────────────────
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '#e2e8f0';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '#f8fafc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.backgroundColor = '#f8fafc';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('Por favor seleccione un archivo .CSV');
            return;
        }
        currentFile = file;
        fileNameDisplay.textContent = file.name;
        uploadStatus.classList.remove('d-none');
        errorZone.classList.add('d-none');
        successZone.classList.add('d-none');
    }

    // ── Subir archivo ─────────────────────────────────────────────────────────
    btnSubir.addEventListener('click', async () => {
        if (!currentFile) return;

        const entidad = entidadSelect.value;
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('entidad', entidad);

        try {
            btnSubir.disabled = true;
            btnSubir.innerHTML = '<i data-lucide="loader-2" class="me-2 spinner" style="width: 18px;"></i> Subiendo...';
            if(typeof lucide !== 'undefined') lucide.createIcons();

            errorZone.classList.add('d-none');
            successZone.classList.add('d-none');

            const response = await fetch(`${API_URL}/api/carga`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.ok) {
                // Éxito
                successMessage.textContent = `${result.insertados} registros de ${entidad} importados correctamente.`;
                successZone.classList.remove('d-none');
                
                // Limpiar selección
                currentFile = null;
                fileInput.value = '';
                uploadStatus.classList.add('d-none');
            } else {
                // Errores
                errorList.innerHTML = '';
                if (result.errores && result.errores.length > 0) {
                    result.errores.forEach(err => {
                        const li = document.createElement('li');
                        li.textContent = err;
                        errorList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = result.error || 'Error desconocido';
                    errorList.appendChild(li);
                }
                errorZone.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error al subir archivo:', error);
            errorList.innerHTML = '<li>Error de conexión con el servidor.</li>';
            errorZone.classList.remove('d-none');
        } finally {
            btnSubir.disabled = false;
            btnSubir.innerHTML = '<i data-lucide="upload" class="me-2" style="width: 18px;"></i> Subir Archivo';
            if(typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
});

