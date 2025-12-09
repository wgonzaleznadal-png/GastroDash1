-- CreateEnum
CREATE TYPE "TipoArticulo" AS ENUM ('INGREDIENTE', 'PRODUCTO_DIRECTO', 'INSUMO', 'GASTO_SERVICIO');

-- CreateEnum
CREATE TYPE "CategoriaArticulo" AS ENUM ('ALIMENTOS', 'BEBIDAS_ALCOHOLICAS', 'BEBIDAS_SIN_ALCOHOL', 'LIMPIEZA', 'DESCARTABLES', 'UTENSILIOS', 'SERVICIOS', 'ALQUILER', 'IMPUESTOS', 'SUELDOS', 'OTROS');

-- CreateEnum
CREATE TYPE "UbicacionStock" AS ENUM ('COCINA', 'BAR', 'DEPOSITO', 'HELADERA', 'FREEZER', 'MOSTRADOR');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'TICKET', 'RECIBO', 'REMITO', 'GASTO_INTERNO');

-- CreateEnum
CREATE TYPE "EstadoComprobante" AS ENUM ('PENDIENTE', 'RECIBIDO', 'PARCIAL', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoProductoMenu" AS ENUM ('ELABORADO', 'DIRECTO');

-- CreateTable
CREATE TABLE "articulos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigoInterno" TEXT,
    "codigoBarras" TEXT,
    "tipo" "TipoArticulo" NOT NULL,
    "categoria" "CategoriaArticulo" NOT NULL,
    "afectaStock" BOOLEAN NOT NULL DEFAULT true,
    "stockActual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "unidad" "UnidadMedida" NOT NULL,
    "ubicacion" "UbicacionStock",
    "costoPromedio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costoUltimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "seVende" BOOLEAN NOT NULL DEFAULT false,
    "precioVenta" DECIMAL(10,2),
    "marca" TEXT,
    "esGenerico" BOOLEAN NOT NULL DEFAULT true,
    "articuloGenericoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "articulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL,
    "proveedorId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroComprobante" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoComprobante" NOT NULL DEFAULT 'PENDIENTE',
    "imagenUrl" TEXT,
    "ocrProcesado" BOOLEAN NOT NULL DEFAULT false,
    "ocrConfianza" DECIMAL(5,2),
    "ocrDatosRaw" JSONB,
    "observaciones" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "comprobantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_comprobante" (
    "id" TEXT NOT NULL,
    "comprobanteId" TEXT NOT NULL,
    "articuloId" TEXT,
    "descripcionOriginal" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "precioTotal" DECIMAL(10,2) NOT NULL,
    "cantidadRecibida" DECIMAL(10,3),
    "fechaRecepcion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,

    CONSTRAINT "items_comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_menu" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT,
    "categoriaId" TEXT,
    "tipoProducto" "TipoProductoMenu" NOT NULL DEFAULT 'ELABORADO',
    "articuloId" TEXT,
    "cantidadPorUnidad" DECIMAL(10,3),
    "precio" DECIMAL(10,2) NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "margen" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "tiempoPreparacion" INTEGER,
    "modalidades" JSONB NOT NULL DEFAULT '["MOSTRADOR", "MESA", "DELIVERY", "ONLINE"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas_articulo" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recetas_articulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alias_articulos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alias_articulos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articulos_tenantId_tipo_idx" ON "articulos"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "articulos_tenantId_categoria_idx" ON "articulos"("tenantId", "categoria");

-- CreateIndex
CREATE INDEX "articulos_tenantId_activo_idx" ON "articulos"("tenantId", "activo");

-- CreateIndex
CREATE INDEX "articulos_tenantId_ubicacion_idx" ON "articulos"("tenantId", "ubicacion");

-- CreateIndex
CREATE UNIQUE INDEX "articulos_tenantId_nombre_marca_key" ON "articulos"("tenantId", "nombre", "marca");

-- CreateIndex
CREATE INDEX "comprobantes_tenantId_fecha_idx" ON "comprobantes"("tenantId", "fecha");

-- CreateIndex
CREATE INDEX "comprobantes_tenantId_estado_idx" ON "comprobantes"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "comprobantes_tenantId_tipoComprobante_idx" ON "comprobantes"("tenantId", "tipoComprobante");

-- CreateIndex
CREATE INDEX "comprobantes_proveedorId_idx" ON "comprobantes"("proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_tenantId_numero_key" ON "comprobantes"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "items_comprobante_comprobanteId_idx" ON "items_comprobante"("comprobanteId");

-- CreateIndex
CREATE INDEX "items_comprobante_articuloId_idx" ON "items_comprobante"("articuloId");

-- CreateIndex
CREATE INDEX "productos_menu_tenantId_disponible_idx" ON "productos_menu"("tenantId", "disponible");

-- CreateIndex
CREATE INDEX "productos_menu_tenantId_categoriaId_idx" ON "productos_menu"("tenantId", "categoriaId");

-- CreateIndex
CREATE INDEX "productos_menu_tenantId_tipoProducto_idx" ON "productos_menu"("tenantId", "tipoProducto");

-- CreateIndex
CREATE UNIQUE INDEX "productos_menu_tenantId_nombre_key" ON "productos_menu"("tenantId", "nombre");

-- CreateIndex
CREATE INDEX "recetas_articulo_productoId_idx" ON "recetas_articulo"("productoId");

-- CreateIndex
CREATE INDEX "recetas_articulo_articuloId_idx" ON "recetas_articulo"("articuloId");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_articulo_productoId_articuloId_key" ON "recetas_articulo"("productoId", "articuloId");

-- CreateIndex
CREATE INDEX "alias_articulos_tenantId_idx" ON "alias_articulos"("tenantId");

-- CreateIndex
CREATE INDEX "alias_articulos_articuloId_idx" ON "alias_articulos"("articuloId");

-- CreateIndex
CREATE UNIQUE INDEX "alias_articulos_tenantId_alias_key" ON "alias_articulos"("tenantId", "alias");

-- AddForeignKey
ALTER TABLE "articulos" ADD CONSTRAINT "articulos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulos" ADD CONSTRAINT "articulos_articuloGenericoId_fkey" FOREIGN KEY ("articuloGenericoId") REFERENCES "articulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_comprobante" ADD CONSTRAINT "items_comprobante_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "comprobantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_comprobante" ADD CONSTRAINT "items_comprobante_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_menu" ADD CONSTRAINT "productos_menu_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_menu" ADD CONSTRAINT "productos_menu_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_menu" ADD CONSTRAINT "productos_menu_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_articulo" ADD CONSTRAINT "recetas_articulo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_articulo" ADD CONSTRAINT "recetas_articulo_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alias_articulos" ADD CONSTRAINT "alias_articulos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alias_articulos" ADD CONSTRAINT "alias_articulos_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
