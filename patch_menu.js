const fs = require('fs');
const files = ['index.html', 'factura.html', 'clientes.html', 'productos.html', 'carga-masiva.html', 'facturas-lista.html', 'generate_pages.js'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Eliminar enlace de Dashboard
    content = content.replace(/<a href="index\.html"[\s\S]*?<i data-lucide="pie-chart"[\s\S]*?<\/a>\s*/g, '');

    // Reemplazar Ver Facturas (quitar border, background-color, font-size custom, margin-left)
    const verFacturasRegex = /<a href="facturas-lista\.html".*?Ver Facturas\s*<\/a>/sg;
    const verFacturasNew = `<a href="facturas-lista.html" class="nav-link-custom text-decoration-none d-flex align-items-center px-3 py-2 mb-2 rounded" style="color: var(--text-muted); font-weight: 500; transition: all 0.2s;">
                    <i data-lucide="list" class="me-2" aria-hidden="true"></i> Ver Facturas
                </a>`;
                
    content = content.replace(verFacturasRegex, verFacturasNew);

    // Ajustar margin bottom de Nueva Factura de mb-1 a mb-2 para mantener consistencia
    content = content.replace(/mb-1 rounded factura-nav-link/g, 'mb-2 rounded factura-nav-link');

    fs.writeFileSync(file, content);
    console.log(`Menú parchado en: ${file}`);
});
