# Sistema de Facturación (FACTU)

FACTU es un sistema de facturación diseñado para la gestión de clientes, productos y la generación de facturas en un entorno ágil y moderno. Este repositorio contiene tanto la lógica del backend (Node.js/Express) como la interfaz de usuario frontend (HTML/CSS/JS Vanilla).

---

## 📋 Resumen 1: Técnico y Profesional (Para el Guía / Tutor / Repositorio)

### Contexto del Despliegue del Sistema de Facturación (FACTU)
El proyecto ha sido migrado exitosamente de un entorno de desarrollo local a una arquitectura distribuida en la nube, desacoplando los componentes de la siguiente manera:

*   **Frontend (Presentación):** Desplegado en **Vercel**, sirviendo los recursos estáticos desde la carpeta pública (`public`).
*   **Backend (Lógica de Negocio):** Hospedado en **Render** como un Web Service basado en Node.js.
*   **Base de Datos (Persistencia):** Instancia administrada de **PostgreSQL** en la nube de Render.

### Estrategia de Ramas en Git y Sincronización
Para simplificar la integración continua (CI/CD) en las plataformas de la nube, se homogeneizó la rama `main` como la rama oficial de producción para ambos servicios (Vercel y Render). El entorno de desarrollo local se mantiene protegido en la rama `develop`. Los cambios confirmados y estables se fusionan mediante merges controlados hacia `main`, lo que dispara los despliegues automatizados en segundos.

### Incidencias Resueltas en la Migración

1.  **Configuración de Persistencia Externa:** Se corrigió un error de conexión (`ECONNREFUSED` en `localhost`) modificando el archivo de conexión de la base de datos (`server/config/db.js`). Se eliminaron las credenciales estáticas locales y se configuró para consumir de forma dinámica la variable de entorno `process.env.DATABASE_URL`, habilitando además las directivas SSL necesarias (`ssl: { rejectUnauthorized: false }`) para la comunicación segura entre servidores.
2.  **Sensibilidad a Mayúsculas/Minúsculas (Case-Sensitivity):** Se solventaron múltiples errores *404 Not Found* en el frontend que impedían la carga de las entidades del modelo. Al pasar de un entorno de desarrollo Windows (insensible a mayúsculas) a contenedores de producción basados en Linux (estrictamente sensibles), las referencias en las etiquetas `<script>` de los archivos HTML no coincidían con el sistema de archivos real. Se estandarizaron todas las rutas y se aseguró el orden de carga jerárquico (Modelos antes que Controladores).
3.  **Refactorización de Arquitectura del Cliente (Vanilla JS):** Se corrigió un error de sintaxis en el navegador (`Unexpected token 'export'`) originado en el archivo de configuración global del frontend (`public/js/config.js`). Al tratarse de JavaScript clásico, se removieron las declaraciones de módulos ES6 y se transformó la dirección del backend en una constante global accesible, garantizando que todas las peticiones asíncronas (`fetch`) construyan rutas absolutas dirigidas al servidor de Render y no a rutas relativas locales.

---

## 🛠️ Arquitectura y Estructura del Proyecto

El proyecto está organizado en dos componentes principales desacoplados:

### 📂 Estructura de Directorios
```
SistemaFacturacion/
├── public/                 # Recursos Frontend (Presentación)
│   ├── css/                # Estilos del sistema
│   ├── js/                 # Lógica del cliente (Vanilla JS)
│   │   ├── controllers/    # Controladores frontend
│   │   ├── models/         # Modelos de datos del frontend
│   │   ├── config.js       # URL base de conexión al Backend
│   │   └── ...
│   ├── index.html          # Punto de entrada frontend
│   └── ...html             # Vistas de la aplicación
├── server/                 # Recursos Backend (Lógica de Negocio)
│   ├── config/             # Configuración (Conexión a BD)
│   ├── controllers/        # Controladores API
│   ├── db/                 # Scripts de base de datos (Semillas)
│   └── routes/             # Definición de endpoints de Express
├── server.js               # Punto de entrada de la aplicación Node.js
├── package.json            # Dependencias y scripts del proyecto
└── README.md               # Documentación general
```

### 🔌 Endpoints de la API Backend
La API está construida en Node.js utilizando Express. Los endpoints principales de negocio son:
*   **Autenticación:** `/api/auth`
*   **Clientes:** `/api/clientes`
*   **Productos:** `/api/productos`
*   **Facturas:** `/api/facturas`
*   **Métodos de Pago:** `/api/metodos-pago`
*   **Carga Masiva:** `/api/carga`
*   **Healthcheck:** `/api/health`

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
*   [Node.js](https://nodejs.org/) (versión 16 o superior)
*   [PostgreSQL](https://www.postgresql.org/) (para persistencia local)

### Configuración del Entorno
Crea un archivo `.env` en la raíz del proyecto basado en la siguiente plantilla:
```env
PORT=3000
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_base_datos
```

### Pasos para iniciar
1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Cargar semilla / datos iniciales:**
    ```bash
    npm run seed
    ```
3.  **Iniciar en modo desarrollo:**
    ```bash
    npm run dev
    ```
4.  **Probar flujo de facturas:**
    ```bash
    npm run test:factura
    ```
