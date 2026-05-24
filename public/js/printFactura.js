/**
 * printFactura.js — Utilidad compartida para imprimir facturas
 * Crea un modal de vista previa y abre una ventana de impresión limpia.
 *
 * API pública:
 *   _abrirImpresionFactura(facturaObj)  → abre modal con vista previa
 *   _ejecutarImpresion()               → dispara window.print() en ventana limpia
 */
window._abrirImpresionFactura = function (f) {
    // Eliminar modal previo si existe
    document.getElementById('modalImpresion')?.remove();

    const fecha = f.fecha
        ? new Date(f.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
        : '-';

    const MONEDA = v => `$ ${parseFloat(v || 0).toFixed(2)}`;

    // Filas de detalle
    const filasDetalle = (f.detalles || []).map(d => `
        <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${d.codigo}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${d.cantidad}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${MONEDA(d.precio)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${parseFloat(d.iva || 0).toFixed(0)}%</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">${MONEDA(d.total)}</td>
        </tr>`).join('');

    // Filas de pagos
    const filasPagos = (f.pagos || []).map(p => `
        <tr>
            <td style="padding:4px 8px;color:#374151;">${p.metodo}</td>
            <td style="padding:4px 8px;text-align:right;font-weight:600;">${MONEDA(p.monto)}</td>
        </tr>`).join('');

    const subtotal = MONEDA((f.total || 0) - (f.iva || 0));
    const estadoColor  = f.estado === 'aprobado' ? '#15803d' : '#dc2626';
    const estadoTexto  = f.estado === 'aprobado' ? '✓ Aprobado' : '✗ Anulado';

    const printBody = `
        <div id="facturaParaImprimir" style="font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#111;max-width:720px;margin:0 auto;">

            <!-- Cabecera empresa -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0b4182;padding-bottom:16px;margin-bottom:16px;">
                <div>
                    <div style="font-size:24px;font-weight:800;color:#0b4182;letter-spacing:-0.5px;">FACTU</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:2px;">Agencia de Viajes FACTU S.A.</div>
                    <div style="font-size:11px;color:#6b7280;">RUC: 1792929292001</div>
                    <div style="font-size:11px;color:#6b7280;">Av. Siempre Viva 123 &nbsp;|&nbsp; +593 999 999 999</div>
                </div>
                <div style="text-align:right;">
                    <div style="background:#0b4182;color:#fff;padding:6px 14px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:.5px;display:inline-block;">FACTURA</div>
                    <div style="font-size:18px;font-weight:800;color:#0b4182;margin-top:6px;">${f.id}</div>
                    <div style="font-size:11px;color:#6b7280;">Fecha: ${fecha}</div>
                    <div style="font-size:11px;">Estado: <span style="color:${estadoColor};font-weight:700;">${estadoTexto}</span></div>
                </div>
            </div>

            <!-- Datos del cliente -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#6b7280;margin-bottom:6px;">CLIENTE</div>
                <div style="font-weight:700;font-size:14px;">${f.cliente || 'Consumidor Final'}</div>
                <div style="font-size:11px;color:#6b7280;">CI/RUC: ${f.ruc || '-'}</div>
                ${f.email    ? `<div style="font-size:11px;color:#6b7280;">Email: ${f.email}</div>`    : ''}
                ${f.telefono ? `<div style="font-size:11px;color:#6b7280;">Tel: ${f.telefono}</div>`   : ''}
            </div>

            <!-- Tabla productos -->
            <div style="overflow-x:auto; margin-bottom:16px; border-radius:4px;">
                <table style="width:100%; border-collapse:collapse; min-width:480px;">
                    <thead>
                        <tr style="background:#0b4182;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">
                            <th style="padding:8px;text-align:left;">Descripción</th>
                            <th style="padding:8px;text-align:center;">Cant.</th>
                            <th style="padding:8px;text-align:right;">P. Unit.</th>
                            <th style="padding:8px;text-align:right;">IVA %</th>
                            <th style="padding:8px;text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${filasDetalle}</tbody>
                </table>
            </div>

            <!-- Totales + Pagos -->
            <div style="display:flex;flex-wrap:wrap;gap:24px;justify-content:flex-end;align-items:flex-start;">
                ${filasPagos ? `
                <div style="flex:1 1 200px;">
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#6b7280;margin-bottom:6px;">FORMA DE PAGO</div>
                    <table style="width:100%;border-collapse:collapse;font-size:12px;">
                        <tbody>${filasPagos}</tbody>
                    </table>
                </div>` : ''}

                <div style="flex:1 1 210px; max-width: 300px; margin-left: auto;">
                    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#6b7280;border-bottom:1px solid #f1f5f9;">
                        <span>Subtotal:</span><span>${subtotal}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:#6b7280;">
                        <span>IVA (15%):</span><span>${MONEDA(f.iva)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #0b4182;margin-top:4px;font-size:16px;font-weight:800;color:#0b4182;">
                        <span>TOTAL:</span><span>${MONEDA(f.total)}</span>
                    </div>
                </div>
            </div>

            <!-- Pie de página -->
            <div style="margin-top:28px;border-top:1px solid #e5e7eb;padding-top:10px;text-align:center;font-size:10px;color:#9ca3af;">
                Documento generado por FACTU &bull; ${new Date().toLocaleString('es-EC')} &bull; Este comprobante es válido como recibo de pago.
            </div>
        </div>`;

    const modalHTML = `
    <div class="modal fade" id="modalImpresion" tabindex="-1" aria-labelledby="modalImpresionLabel">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg" style="border-radius:14px;">
                <div class="modal-header border-0 pb-0 pt-3 px-4">
                    <div class="d-flex align-items-center gap-2">
                        <i data-lucide="file-text" class="text-primary" style="width:18px;height:18px;" aria-hidden="true"></i>
                        <h5 class="modal-title fw-bold mb-0" id="modalImpresionLabel">
                            Vista Previa &mdash; <span class="text-primary">${f.id}</span>
                        </h5>
                    </div>
                    <div class="d-flex gap-2 ms-auto align-items-center">
                        <button class="btn btn-primary btn-sm fw-bold d-flex align-items-center gap-1"
                                onclick="_ejecutarImpresion()" aria-label="Imprimir factura">
                            <i data-lucide="printer" style="width:14px;height:14px;" aria-hidden="true"></i>
                            <span>Imprimir</span>
                        </button>
                        <button class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                </div>
                <div class="modal-body p-4" style="background:#f8fafc;border-radius:0 0 14px 14px;">
                    <div style="background:#fff;border-radius:10px;padding:28px;box-shadow:0 1px 6px rgba(0,0,0,.07);">
                        ${printBody}
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    new bootstrap.Modal(document.getElementById('modalImpresion')).show();

    // Limpiar al cerrar
    document.getElementById('modalImpresion').addEventListener('hidden.bs.modal', () => {
        document.getElementById('modalImpresion')?.remove();
    });
};

/** Abre una ventana de impresión limpia con solo el contenido de la factura */
window._ejecutarImpresion = function () {
    const contenido = document.getElementById('facturaParaImprimir');
    if (!contenido) return;
    const ventana = window.open('', '_blank', 'width=820,height=750');
    ventana.document.write(`<!DOCTYPE html><html lang="es"><head>
        <meta charset="UTF-8">
        <title>Factura</title>
        <style>
            *{box-sizing:border-box;margin:0;padding:0;}
            body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#111;padding:36px;}
            @media print{
                body{padding:0;}
                @page{size:A4;margin:1.8cm;}
            }
        </style>
    </head><body>${contenido.outerHTML}</body></html>`);
    ventana.document.close();
    ventana.onload = () => { ventana.focus(); ventana.print(); };
};
