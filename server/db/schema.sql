-- ==============================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS (SISTEMA DE FACTURACIÓN - FACTU)
-- Motor: PostgreSQL
-- ==============================================================================

-- 1. TABLA ROLES
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- Insertamos el rol por defecto (admin)
INSERT INTO roles (nombre_rol, descripcion) VALUES ('Administrador', 'Acceso total al sistema');

-- 2. TABLA USUARIOS
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT
);

-- Nota: Deberás insertar el usuario admin con una contraseña encriptada usando bcrypt después.

-- 3. TABLA CLIENTES
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    ruc_o_cedula VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    ultima_compra VARCHAR(50),
    estado BOOLEAN DEFAULT TRUE
);

-- 4. TABLA PRODUCTOS
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

-- 5. TABLA FACTURAS (CABECERA)
CREATE TABLE facturas (
    id_factura SERIAL PRIMARY KEY,
    codigo_factura VARCHAR(50) NOT NULL UNIQUE,
    id_cliente INT NOT NULL,
    id_empresa INT DEFAULT 1,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'aprobado',
    iva_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_facturas_clientes FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE RESTRICT
);

-- 6. TABLA FACTURA_DETALLES
CREATE TABLE factura_detalles (
    id_detalle SERIAL PRIMARY KEY,
    id_factura INT NOT NULL,
    codigo_producto VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    iva DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cantidad_iva DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    total_producto DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_detalles_facturas FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE CASCADE,
    CONSTRAINT fk_detalles_productos FOREIGN KEY (codigo_producto) REFERENCES productos(codigo) ON DELETE RESTRICT,
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0)
);

-- Índices recomendados para búsquedas rápidas
CREATE INDEX idx_clientes_ruc ON clientes(ruc_o_cedula);
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_facturas_codigo ON facturas(codigo_factura);
