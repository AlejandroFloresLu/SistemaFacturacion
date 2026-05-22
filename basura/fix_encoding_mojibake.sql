-- =============================================================================
-- fix_encoding_mojibake.sql
-- Corrige datos con mojibake (UTF-8 leído como Latin-1) en tablas de FACTU.
-- Ejecutar en pgAdmin → Query Tool sobre la BD "factu".
--
-- El patrón típico de mojibake en Windows (pg lía WIN1252 con UTF-8):
--   'é' guardado mal → aparece como 'Ã©'
--   'ú' guardado mal → aparece como 'Ãº'
--   'ó' guardado mal → aparece como 'Ã³'
--   'á' guardado mal → aparece como 'Ã¡'
--   'í' guardado mal → aparece como 'Ã­'
--   'ñ' guardado mal → aparece como 'Ã±'
--   '‹' guardado mal → aparece como 'â€¹'  (botón prev)
--   '›' guardado mal → aparece como 'â€º'  (botón next)
-- =============================================================================

-- 1. Ver cuántos productos tienen descripción dañada
SELECT COUNT(*) AS productos_con_mojibake
FROM productos
WHERE descripcion LIKE '%Ã%' OR descripcion LIKE '%â€%';

-- 2. Ver qué productos están afectados
SELECT codigo, descripcion FROM productos
WHERE descripcion LIKE '%Ã%' OR descripcion LIKE '%â€%'
ORDER BY codigo;

-- 3. Reparar descripciones de productos
--    Aplica sustituciones carácter por carácter (el orden importa: largas primero)
UPDATE productos SET descripcion = (
    descripcion
    -- vocales con tilde
    |> replace('Ã¡', 'á')
    |> replace('Ã©', 'é')
    |> replace('Ã­', 'í')
    |> replace('Ã³', 'ó')
    |> replace('Ãº', 'ú')
    -- mayúsculas con tilde
    |> replace('Ã', 'Á')
    |> replace('Ã‰', 'É')
    |> replace('Ã', 'Í')
    |> replace('Ã"', 'Ó')
    |> replace('Ãš', 'Ú')
    -- ñ / Ñ
    |> replace('Ã±', 'ñ')
    |> replace('Ã'', 'Ñ')
    -- ü / Ü
    |> replace('Ã¼', 'ü')
    |> replace('Ã¼', 'Ü')
    -- signos de puntuación especiales
    |> replace('â€™', '''')
    |> replace('â€œ', '"')
    |> replace('â€', '"')
    |> replace('â€¦', '…')
    |> replace('â€"', '–')
    |> replace('â€"', '—')
)
WHERE descripcion LIKE '%Ã%' OR descripcion LIKE '%â€%';


-- NOTA: Si tu versión de PostgreSQL < 16 no soporta el operador |>,
-- usa la función replace() anidada en su lugar:
-- UPDATE productos SET descripcion =
--     replace(replace(replace(replace(replace(replace(replace(replace(
--         replace(replace(replace(replace(replace(replace(replace(descripcion,
--         'Ã¡','á'),'Ã©','é'),'Ã­','í'),'Ã³','ó'),'Ãº','ú'),
--         'Ã','Á'),'Ã‰','É'),'Ã"','Ó'),'Ãš','Ú'),
--         'Ã±','ñ'),'Ã'','Ñ'),'â€™',''''),'â€œ','"'),'â€','"'),'â€¦','…')
-- WHERE descripcion LIKE '%Ã%' OR descripcion LIKE '%â€%';


-- 4. Hacer lo mismo para nombres/apellidos de clientes
UPDATE clientes SET
    nombres   = replace(replace(replace(replace(replace(replace(replace(
                    nombres,'Ã¡','á'),'Ã©','é'),'Ã­','í'),'Ã³','ó'),'Ãº','ú'),'Ã±','ñ'),'Ã'','Ñ'),
    apellidos = replace(replace(replace(replace(replace(replace(replace(
                    apellidos,'Ã¡','á'),'Ã©','é'),'Ã­','í'),'Ã³','ó'),'Ãº','ú'),'Ã±','ñ'),'Ã'','Ñ')
WHERE nombres   LIKE '%Ã%'
   OR apellidos LIKE '%Ã%';


-- 5. Verificar resultado
SELECT codigo, descripcion FROM productos ORDER BY codigo LIMIT 20;
SELECT nombres, apellidos FROM clientes ORDER BY id_cliente LIMIT 10;
