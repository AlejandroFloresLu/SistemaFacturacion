-- ==============================================================================
-- MIGRACIÓN: Soporte para múltiples métodos de pago por factura
-- Ejecutar: psql -U postgres -d factu -f server/db/migrate_pagos.sql
-- ==============================================================================

-- 1. CATÁLOGO DE MÉTODOS DE PAGO
CREATE TABLE IF NOT EXISTS metodos_pago (
    id_metodo  SERIAL PRIMARY KEY,
    nombre     VARCHAR(60) NOT NULL UNIQUE,
    activo     BOOLEAN DEFAULT TRUE
);

-- Catálogo inicial
INSERT INTO metodos_pago (nombre) VALUES
    ('Efectivo'),
    ('Tarjeta de Crédito'),
    ('Tarjeta de Débito'),
    ('Transferencia Bancaria'),
    ('Cheque')
ON CONFLICT (nombre) DO NOTHING;

-- 2. TABLA INTERMEDIA: PAGOS POR FACTURA
CREATE TABLE IF NOT EXISTS factura_pagos (
    id_pago     SERIAL PRIMARY KEY,
    id_factura  INT NOT NULL,
    id_metodo   INT NOT NULL,
    monto       DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    referencia  VARCHAR(100),           -- Opcional: nro. de cheque, código de transferencia, etc.
    CONSTRAINT fk_fp_factura FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE CASCADE,
    CONSTRAINT fk_fp_metodo  FOREIGN KEY (id_metodo)  REFERENCES metodos_pago(id_metodo) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_factura_pagos_factura ON factura_pagos(id_factura);
