const fs = require('fs');
const files = ['index.html', 'factura.html', 'clientes.html', 'productos.html', 'carga-masiva.html', 'facturas-lista.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. Aria-hidden to lucide icons
    content = content.replace(/<i data-lucide="([^"]+)"([^>]*)><\/i>/g, (match, p1, p2) => {
        if (!p2.includes('aria-hidden')) {
            return `<i data-lucide="${p1}"${p2} aria-hidden="true"></i>`;
        }
        return match;
    });

    // 2. Roles
    content = content.replace(/<div class="flex-grow-1" id="navAccordion">/, '<div class="flex-grow-1" id="navAccordion" role="navigation" aria-label="Menú principal">');
    if(!content.includes('role="main"')){
        content = content.replace(/<main class="main-content([^>]*)>/, '<main class="main-content$1" role="main">');
    }

    // 3. Accessible Buttons
    content = content.replace(/<button class="btn btn-light border me-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">/, '<button class="btn btn-light border me-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu" aria-label="Abrir menú">');
    content = content.replace(/<button type="button" class="btn-close d-lg-none" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu"><\/button>/g, '<button type="button" class="btn-close d-lg-none" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu" aria-label="Cerrar menú"></button>');

    // Factura specific buttons
    content = content.replace(/id="btnEscape"\s*title="Cancelar factura">/, 'id="btnEscape" title="Cancelar factura" aria-label="Cancelar selección de cliente">');
    content = content.replace(/id="btnAddPayment" disabled><i/, 'id="btnAddPayment" disabled aria-label="Agregar pago"><i');

    // Drag and Drop (Carga Masiva) - make it focusable and accessible
    content = content.replace(/<div id="dropZone" class="border-2(.*)onclick="([^"]+)">/, '<div id="dropZone" class="border-2$1 onclick="$2" tabindex="0" role="button" aria-label="Área para subir archivo de carga masiva">');

    // Add visual hidden text to edit/delete buttons
    content = content.replace(/<button class="btn btn-sm btn-light border-0 text-primary me-1"><i data-lucide="edit-2" style="width:16px;" aria-hidden="true"><\/i><\/button>/g, '<button class="btn btn-sm btn-light border-0 text-primary me-1" aria-label="Editar" title="Editar"><i data-lucide="edit-2" style="width:16px;" aria-hidden="true"></i></button>');
    content = content.replace(/<button class="btn btn-sm btn-light border-0 text-danger"><i data-lucide="trash-2" style="width:16px;" aria-hidden="true"><\/i><\/button>/g, '<button class="btn btn-sm btn-light border-0 text-danger" aria-label="Eliminar" title="Eliminar"><i data-lucide="trash-2" style="width:16px;" aria-hidden="true"></i></button>');

    fs.writeFileSync(file, content);
    console.log(`Parchado con accesibilidad: ${file}`);
});
