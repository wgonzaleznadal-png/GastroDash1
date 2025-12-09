/*
  Warnings:

  - You are about to drop the column `costo` on the `ingredientes` table. All the data in the column will be lost.
  - You are about to drop the column `esCompuesto` on the `ingredientes` table. All the data in the column will be lost.
  - You are about to drop the column `stockActual` on the `ingredientes` table. All the data in the column will be lost.
  - You are about to drop the column `stockMinimo` on the `ingredientes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ingredientes" DROP COLUMN "costo",
DROP COLUMN "esCompuesto",
DROP COLUMN "stockActual",
DROP COLUMN "stockMinimo",
ADD COLUMN     "costo_promedio" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "es_compuesto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock_actual" DECIMAL(10,3) NOT NULL DEFAULT 0,
ADD COLUMN     "stock_minimo" DECIMAL(10,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "razonSocial" TEXT,
    "cuit" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "contacto" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "numeroFactura" TEXT,
    "fechaCompra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_compra" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "marca" TEXT,
    "cantidadComprada" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "precioTotal" DECIMAL(10,2) NOT NULL,
    "cantidadRecibida" DECIMAL(10,3),
    "fechaRecepcion" TIMESTAMP(3),
    "observaciones" TEXT,

    CONSTRAINT "items_compra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proveedores_tenantId_activo_idx" ON "proveedores"("tenantId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_tenantId_nombre_key" ON "proveedores"("tenantId", "nombre");

-- CreateIndex
CREATE INDEX "compras_tenantId_fechaCompra_idx" ON "compras"("tenantId", "fechaCompra");

-- CreateIndex
CREATE INDEX "compras_tenantId_estado_idx" ON "compras"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "compras_proveedorId_idx" ON "compras"("proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "compras_tenantId_numero_key" ON "compras"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "items_compra_compraId_idx" ON "items_compra"("compraId");

-- CreateIndex
CREATE INDEX "items_compra_ingredienteId_idx" ON "items_compra"("ingredienteId");

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_compra" ADD CONSTRAINT "items_compra_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
