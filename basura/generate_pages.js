const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const splitStart = indexHtml.indexOf('<main class="main-content');
const splitEnd = indexHtml.indexOf('</main>') + 7;

const head = indexHtml.substring(0, splitStart);
const tail = indexHtml.substring(splitEnd);

const pages = [
  {
    name: 'clientes.html',
    title: 'FACTU - Clientes',
    main: `<main class="main-content p-4 bg-light" style="min-height: 100vh;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="fw-bold m-0 text-dark"><i data-lucide="users" class="me-2 text-primary"></i>Directorio de Clientes</h2>
                <p class="text-muted mt-1 mb-0">Administra a tus clientes y agencias de viaje asociados.</p>
            </div>
            <button class="btn btn-factu shadow-sm"><i data-lucide="plus" class="me-1"></i> Nuevo Cliente</button>
        </div>
        
        <div class="card shadow-sm border-0" style="border-radius: var(--border-radius);">
            <div class="card-header bg-white border-0 pt-4 pb-2 d-flex justify-content-between align-items-center">
                <div class="input-group" style="max-width: 400px;">
                    <span class="input-group-text bg-light border-0"><i data-lucide="search" class="text-muted"></i></span>
                    <input type="text" class="form-control bg-light border-0 shadow-none" placeholder="Buscar por nombre, correo o RUC...">
                </div>
                <button class="btn btn-outline-secondary btn-sm"><i data-lucide="filter" class="me-1" style="width: 14px;"></i> Filtros</button>
            </div>
            <div class="card-body p-0">
                <table class="table table-hover mb-0 align-middle">
                    <thead class="bg-light text-muted">
                        <tr>
                            <th class="ps-4">Cliente</th>
                            <th>Identificación (RUC/CC)</th>
                            <th>Contacto</th>
                            <th>Última Compra</th>
                            <th class="text-end pe-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="ps-4">
                                <div class="d-flex align-items-center">
                                    <div class="avatar-circle bg-primary bg-opacity-10 text-primary me-3" style="width:36px; height:36px; font-size:14px;">AF</div>
                                    <div class="fw-bold text-dark">Alejandro Flores</div>
                                </div>
                            </td>
                            <td>1201201201</td>
                            <td class="text-muted small">0999999999<br>alejandro@email.com</td>
                            <td><span class="badge bg-light text-dark border">Hace 2 días</span></td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-light border-0 text-primary me-1"><i data-lucide="edit-2" style="width:16px;"></i></button>
                                <button class="btn btn-sm btn-light border-0 text-danger"><i data-lucide="trash-2" style="width:16px;"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="ps-4">
                                <div class="d-flex align-items-center">
                                    <div class="avatar-circle bg-primary bg-opacity-10 text-primary me-3" style="width:36px; height:36px; font-size:14px;">MT</div>
                                    <div class="fw-bold text-dark">María Torres</div>
                                </div>
                            </td>
                            <td>1104845567</td>
                            <td class="text-muted small">0988888888<br>maria@agencia.com</td>
                            <td><span class="badge bg-light text-dark border">Hace 1 mes</span></td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-light border-0 text-primary me-1"><i data-lucide="edit-2" style="width:16px;"></i></button>
                                <button class="btn btn-sm btn-light border-0 text-danger"><i data-lucide="trash-2" style="width:16px;"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center text-muted small">
                Mostrando 2 de 24 clientes
                <ul class="pagination pagination-sm m-0">
                    <li class="page-item disabled"><a class="page-link" href="#">Anterior</a></li>
                    <li class="page-item active"><a class="page-link" href="#">1</a></li>
                    <li class="page-item"><a class="page-link" href="#">2</a></li>
                    <li class="page-item"><a class="page-link" href="#">Siguiente</a></li>
                </ul>
            </div>
        </div>
    </main>`
  },
  {
    name: 'productos.html',
    title: 'FACTU - Productos',
    main: `<main class="main-content p-4 bg-light" style="min-height: 100vh;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="fw-bold m-0 text-dark"><i data-lucide="package" class="me-2 text-primary"></i>Inventario Comercial</h2>
                <p class="text-muted mt-1 mb-0">Gestión de boletos, tours y paquetes turísticos.</p>
            </div>
            <div class="d-flex gap-2">
                <select class="form-select shadow-sm" style="width: auto;">
                    <option>Todos (Categoría)</option>
                    <option>Tours</option>
                    <option>Boletos Aéreos</option>
                    <option>Seguros</option>
                </select>
                <button class="btn btn-factu shadow-sm"><i data-lucide="plus" class="me-1"></i> Añadir Producto</button>
            </div>
        </div>
        
        <div class="card shadow-sm border-0" style="border-radius: var(--border-radius);">
            <div class="card-body p-0">
                <table class="table table-hover mb-0 align-middle">
                    <thead class="bg-light text-muted">
                        <tr>
                            <th class="ps-4">Código / Producto</th>
                            <th>Precio Unitario</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th class="text-end pe-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="ps-4 py-3">
                                <div class="d-flex align-items-center">
                                    <div class="bg-light border rounded p-2 me-3 text-primary"><i data-lucide="map"></i></div>
                                    <div>
                                        <div class="fw-bold text-dark">Tour Isla de Plata</div>
                                        <div class="text-muted small">P-001 • Tour Terrestre</div>
                                    </div>
                                </div>
                            </td>
                            <td class="fw-bold">$ 45.00</td>
                            <td>45 cupos</td>
                            <td><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">En Venta</span></td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-light border-0 text-primary"><i data-lucide="edit" style="width:16px;"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="ps-4 py-3">
                                <div class="d-flex align-items-center">
                                    <div class="bg-light border rounded p-2 me-3 text-primary"><i data-lucide="plane"></i></div>
                                    <div>
                                        <div class="fw-bold text-dark">Vuelo Nacional UI-GYE</div>
                                        <div class="text-muted small">B-104 • Boleto Aéreo</div>
                                    </div>
                                </div>
                            </td>
                            <td class="fw-bold">$ 120.00</td>
                            <td class="text-danger">0 cupos</td>
                            <td><span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">Agotado</span></td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-light border-0 text-primary"><i data-lucide="edit" style="width:16px;"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="ps-4 py-3">
                                <div class="d-flex align-items-center">
                                    <div class="bg-light border rounded p-2 me-3 text-primary"><i data-lucide="shield-check"></i></div>
                                    <div>
                                        <div class="fw-bold text-dark">Seguro de Viaje</div>
                                        <div class="text-muted small">S-005 • Seguro</div>
                                    </div>
                                </div>
                            </td>
                            <td class="fw-bold">$ 25.00</td>
                            <td>Ilimitado</td>
                            <td><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">En Venta</span></td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-light border-0 text-primary"><i data-lucide="edit" style="width:16px;"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>`
  },
  {
    name: 'carga-masiva.html',
    title: 'FACTU - Carga Masiva',
    main: `<main class="main-content p-4 bg-light" style="min-height: 100vh;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="fw-bold m-0 text-dark"><i data-lucide="upload-cloud" class="me-2 text-primary"></i>Carga Masiva de Datos</h2>
                <p class="text-muted mt-1 mb-0">Importar múltiples productos o clientes mediante hoja de cálculo .xlsx o .csv.</p>
            </div>
            <button class="btn btn-outline-secondary bg-white shadow-sm"><i data-lucide="download" class="me-1"></i> Descargar Plantilla</button>
        </div>
        
        <div class="row">
            <div class="col-lg-8">
                <!-- Drag and Drop Area -->
                <div class="card shadow-sm border-0" style="border-radius: var(--border-radius);">
                    <div class="card-body p-5">
                        <div id="dropZone" class="border-2 rounded border-primary border-dashed p-5 text-center transition-all cursor-pointer" style="border-style: dashed; background-color: #f8fafc;" onclick="document.getElementById('fileInput').click()">
                            <input type="file" id="fileInput" class="d-none" accept=".csv, .xlsx">
                            <i data-lucide="file-spreadsheet" style="width: 64px; height: 64px;" class="mb-3 text-primary opacity-75"></i>
                            <h4 class="fw-bold text-dark">Arrastra tu archivo aquí</h4>
                            <p class="text-muted mb-0">O haz clic para explorar tus archivos</p>
                            <p class="small text-muted mt-2 opacity-50">Soporta: XLSX, CSV (Max. 10MB)</p>
                        </div>

                        <!-- Progress Bar (Hidden by default) -->
                        <div id="uploadProgress" class="mt-4 d-none">
                            <div class="d-flex justify-content-between mb-1 small fw-bold">
                                <span>Procesando archivo...</span>
                                <span id="progressText">0%</span>
                            </div>
                            <div class="progress" style="height: 10px;">
                                <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar" style="width: 0%"></div>
                            </div>
                        </div>

                        <!-- Success Alert (Hidden by default) -->
                        <div id="uploadSuccess" class="alert alert-success mt-4 d-none d-flex align-items-center">
                            <i data-lucide="check-circle" class="me-2"></i> 
                            <div>
                                <strong>¡Carga Completada!</strong> Se añadieron 145 productos exitosamente.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="card shadow-sm border-0" style="border-radius: var(--border-radius);">
                    <div class="card-header bg-white border-0 pt-4 pb-0">
                        <h6 class="fw-bold m-0"><i data-lucide="help-circle" class="me-2 text-muted"></i> Instrucciones</h6>
                    </div>
                    <div class="card-body text-muted small">
                        <ul class="list-group list-group-flush list-group-numbered">
                            <li class="list-group-item bg-transparent px-0">Descarga la plantilla Excel del formato requerido.</li>
                            <li class="list-group-item bg-transparent px-0">Llena los datos sin alterar el nombre de las columnas originales.</li>
                            <li class="list-group-item bg-transparent px-0">Revisa que códigos y precios no contengan símbolos raros.</li>
                            <li class="list-group-item bg-transparent px-0">Sube el archivo aquí.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>`
  },
  {
      name: 'facturas-lista.html',
      title: 'FACTU - Ver Facturas',
      main: `<main class="main-content p-4 bg-light" style="min-height: 100vh;">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="fw-bold m-0 text-dark"><i data-lucide="list" class="me-2 text-primary"></i>Historial de Facturas</h2>
                <p class="text-muted mt-1 mb-0">Consulta, imprime y revisa los estados de facturas emitidas.</p>
            </div>
        </div>
        
        <div class="card shadow-sm border-0" style="border-radius: var(--border-radius);">
            <div class="card-header bg-white border-0 pt-4 pb-3">
                <div class="row g-2">
                    <div class="col-md-3">
                        <div class="input-group">
                            <span class="input-group-text bg-light border-1 text-muted"><i data-lucide="calendar" style="width:16px;"></i></span>
                            <input type="date" class="form-control" title="Desde">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="input-group">
                            <span class="input-group-text bg-light border-1 text-muted"><i data-lucide="calendar" style="width:16px;"></i></span>
                            <input type="date" class="form-control" title="Hasta">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select text-muted">
                            <option>Estado: Todos</option>
                            <option>Cobrados</option>
                            <option>Pendiente / Borrador</option>
                            <option>Anulado</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <input type="text" class="form-control" placeholder="# Factura o Cliente">
                    </div>
                </div>
            </div>
            <div class="card-body p-0">
                <table class="table table-hover mb-0 align-middle">
                    <thead class="bg-light text-muted">
                        <tr>
                            <th class="ps-4">No. Factura</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Estado</th>
                            <th class="text-end">Total</th>
                            <th class="text-end pe-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="ps-4 fw-bold text-primary">FAC-000102</td>
                            <td class="text-muted small">15 Ago 2026<br>14:30</td>
                            <td class="fw-bold">María Torres</td>
                            <td><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">Cobrado</span></td>
                            <td class="text-end fw-bold text-dark">$ 145.00</td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-light border-0 text-primary me-1" title="Ver PDF"><i data-lucide="file-text" style="width:16px;"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="ps-4 fw-bold text-primary">FAC-000103</td>
                            <td class="text-muted small">15 Ago 2026<br>15:05</td>
                            <td class="text-muted">Consumidor Final</td>
                            <td><span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1">Borrador</span></td>
                            <td class="text-end fw-bold text-dark">$ 12.00</td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-factu text-white me-1" title="Continuar Edición"><i data-lucide="edit" style="width:14px;"></i></button>
                            </td>
                        </tr>
                        <tr>
                            <td class="ps-4 fw-bold text-danger">FAC-000099</td>
                            <td class="text-muted small">10 Ago 2026<br>09:12</td>
                            <td class="fw-bold">Alejandro Flores</td>
                            <td><span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i data-lucide="x-circle" style="width:12px; margin-right:4px; display:inline-block"></i>Anulado</span></td>
                            <td class="text-end fw-bold text-muted text-decoration-line-through">$ 450.00</td>
                            <td class="text-end pe-4">
                                <button class="btn btn-sm btn-light border-0 text-primary me-1" title="Ver Detalle"><i data-lucide="eye" style="width:16px;"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="card-footer bg-white border-top p-3 text-end text-muted small">
                Mostrando 3 de 45 registros
            </div>
        </div>
    </main>`
  }
];

pages.forEach(page => {
  let content = head + page.main + tail;
  content = content.replace('<title>FACTU - Dashboard</title>', `<title>${page.title}</title>`);
  
  // Clean up existing reference to factura.ui.js if they existed in tail from index.html (there shouldn't be anyway)
  // because index.html does not have factura.ui.js.

  // Only add logic JS specifically if needed, but for now we rely on main.js in tail
  fs.writeFileSync(path.join(__dirname, page.name), content, 'utf8');
  console.log(`Created ${page.name}`);
});
