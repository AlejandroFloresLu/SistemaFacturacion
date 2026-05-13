/**
 * cargaMasivaController.js — Controlador de Carga Masiva
 * Lógica extraída del <script> inline de carga-masiva.html.
 */
document.addEventListener('DOMContentLoaded', function () {
    lucide.createIcons();

    const PLANTILLAS = {
        productos: "Codigo,Descripcion,Precio\nVUE-010,Boleto aereo ejemplo - Clase Economica,120.00\nALO-010,Habitacion hotel ejemplo - Estandar,60.00",
        clientes:  "Nombre,Apellido,RUC_Cedula,Telefono,Email\nJuan,Perez,1234567890,0999000111,juan@example.com",
        facturas:  "NumFactura,FechaEmision,RUC_Cliente,CodigoProducto,Cantidad\nFAC-000200,2026-08-01,1201201201,VUE-001,2"
    };

    window.descargarPlantilla = function (tipo) {
        const csv = PLANTILLAS[tipo];
        if (!csv) return;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `plantilla_${tipo}.csv`;
        document.body.appendChild(a); a.click();
        a.remove(); URL.revokeObjectURL(url);
        mostrarToast(`📅 Plantilla de ${tipo} descargada`, 'info');
    };

    window.simularSubida = function (input, dropId, nombre) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const zona = document.getElementById(dropId);
        zona.innerHTML = `
            <div class="w-100">
                <div class="d-flex align-items-center mb-2">
                    <i data-lucide="file-check-2" style="width:20px;height:20px;" class="text-primary me-2"></i>
                    <span class="fw-bold small text-truncate" style="max-width:160px;">${file.name}</span>
                </div>
                <div class="progress" style="height:8px;border-radius:8px;">
                    <div id="prog_${dropId}" class="progress-bar bg-primary progress-bar-striped progress-bar-animated" style="width:0%"></div>
                </div>
                <div class="text-muted small mt-1" id="progLabel_${dropId}">Procesando...</div>
            </div>`;
        lucide.createIcons();
        let pct = 0;
        const iv = setInterval(() => {
            pct = Math.min(pct + Math.random() * 25, 95);
            const bar = document.getElementById('prog_' + dropId);
            const lbl = document.getElementById('progLabel_' + dropId);
            if (bar) bar.style.width = pct + '%';
            if (lbl) lbl.textContent = `Procesando... ${Math.round(pct)}%`;
        }, 350);
        setTimeout(() => {
            clearInterval(iv);
            const bar = document.getElementById('prog_' + dropId);
            const lbl = document.getElementById('progLabel_' + dropId);
            if (bar) { bar.classList.remove('progress-bar-animated'); bar.style.width='100%'; bar.classList.add('bg-success'); }
            if (lbl) lbl.textContent = '¡Archivo procesado correctamente!';
            mostrarToast(`✅ Carga de ${nombre} completada con éxito`, 'success');
            input.value = '';
            setTimeout(() => {
                zona.innerHTML = `
                    <i data-lucide="upload-cloud" style="width:36px;height:36px;" class="mb-2 text-primary opacity-50 d-block"></i>
                    <span class="fw-bold small text-dark d-block">Soltar archivo aquí</span>
                    <span class="small text-muted mt-1 opacity-50">.XLSX o .CSV</span>`;
                lucide.createIcons();
            }, 4000);
        }, 2200);
    };

    function mostrarToast(msg, tipo = 'success') {
        const t = document.createElement('div');
        t.className = `factu-toast ${tipo}`; t.innerHTML = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }
});
