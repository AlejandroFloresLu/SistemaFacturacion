document.addEventListener("DOMContentLoaded", function() {
    // 1. Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Lógica para mantener el menú abierto según la página actual
    const currentPath = window.location.pathname.split("/").pop();
    const menuLinks = document.querySelectorAll(".sub-nav-link, .nav-link-custom");

    menuLinks.forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active-link");
            
            // Abrir el acordeón padre si existe
            const parentCollapse = link.closest(".collapse");
            if (parentCollapse) {
                const bsCollapse = new bootstrap.Collapse(parentCollapse, { toggle: false });
                bsCollapse.show();
                
                const button = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
                if (button) button.classList.remove("collapsed");
            }
        }
    });

    // 3. Lógica para Carga Masiva (Drag & Drop)
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const uploadSuccess = document.getElementById('uploadSuccess');

    if (dropZone && fileInput) {
        // Prevenir comportamientos por defecto
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Estilos visuales al arrastrar
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-active');
            }, false);
        });

        // Manejar el soltar
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        // Accesibilidad: Permitir abrir con la tecla Enter cuando tiene foco
        dropZone.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // Manejar seleccion manual vía el input file
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });

        function handleFiles(files) {
            if (files.length > 0) {
                simulateUpload(files[0]);
            }
        }

        function simulateUpload(file) {
            // Mostrar progreso
            dropZone.style.display = 'none';
            uploadProgress.classList.remove('d-none');
            uploadSuccess.classList.add('d-none');
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15; // Incrementar
                if (progress > 100) progress = 100;
                
                progressBar.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';

                if (progress === 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        uploadProgress.classList.add('d-none');
                        uploadSuccess.classList.remove('d-none');
                        
                        // Permitir subir otro archivo después de 4 segundos
                        setTimeout(() => {
                            dropZone.style.display = 'block';
                            uploadSuccess.classList.add('d-none');
                            progressBar.style.width = '0%';
                            progressText.textContent = '0%';
                        }, 4000);
                    }, 500);
                }
            }, 300);
        }
    }

});

// 3. Función de favoritos (Global)
function toggleFavorite(event, starElement, label, href) {
    event.preventDefault();
    event.stopPropagation();
    // ... (aquí va el código de la función que ya tenías)
    console.log(`Añadido a favoritos: ${label}`);
}