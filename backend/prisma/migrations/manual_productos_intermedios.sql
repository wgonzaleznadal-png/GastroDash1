-- Migración: Productos Intermedios
-- Fecha: 2024-12-01
-- Descripción: Agrega soporte para productos que también son ingredientes

-- 1. Agregar campos a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS es_producto_intermedio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rendimiento DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS unidad_rendimiento VARCHAR(20);

-- 2. Agregar índice para productos intermedios
CREATE INDEX IF NOT EXISTS idx_productos_intermedio 
ON productos(tenant_id, es_producto_intermedio);

-- 3. Agregar campo producto_vinculado_id a ingredientes
ALTER TABLE ingredientes
ADD COLUMN IF NOT EXISTS producto_vinculado_id VARCHAR(36) UNIQUE;

-- 4. Agregar foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ingrediente_producto'
    ) THEN
        ALTER TABLE ingredientes
        ADD CONSTRAINT fk_ingrediente_producto
        FOREIGN KEY (producto_vinculado_id)
        REFERENCES productos(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Agregar índice para producto vinculado
CREATE INDEX IF NOT EXISTS idx_ingrediente_producto 
ON ingredientes(producto_vinculado_id);

-- 6. Comentarios para documentación
COMMENT ON COLUMN productos.es_producto_intermedio IS 'Indica si este producto también funciona como ingrediente en otras recetas';
COMMENT ON COLUMN productos.rendimiento IS 'Cantidad que produce este producto (ej: 1000 ml, 500 g)';
COMMENT ON COLUMN productos.unidad_rendimiento IS 'Unidad del rendimiento (KILOGRAMO, LITRO, etc.)';
COMMENT ON COLUMN ingredientes.producto_vinculado_id IS 'ID del producto del cual se calcula automáticamente el costo';

-- Verificar que la migración se aplicó correctamente
SELECT 
    'productos' as tabla,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'productos'
AND column_name IN ('es_producto_intermedio', 'rendimiento', 'unidad_rendimiento')

UNION ALL

SELECT 
    'ingredientes' as tabla,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'ingredientes'
AND column_name = 'producto_vinculado_id';
