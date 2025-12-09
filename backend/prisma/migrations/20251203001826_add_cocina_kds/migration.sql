-- CreateEnum
CREATE TYPE "EstadoOrdenCocina" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PrioridadOrden" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "estaciones_cocina" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "estaciones_cocina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_cocina" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ventaId" TEXT NOT NULL,
    "estacionId" TEXT,
    "estado" "EstadoOrdenCocina" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" "PrioridadOrden" NOT NULL DEFAULT 'NORMAL',
    "tiempoEstimado" INTEGER,
    "tiempoInicio" TIMESTAMP(3),
    "tiempoFin" TIMESTAMP(3),
    "tiempoTotal" INTEGER,
    "notas" TEXT,
    "impreso" BOOLEAN NOT NULL DEFAULT false,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ordenes_cocina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden_cocina" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "notas" TEXT,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_orden_cocina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estaciones_cocina_tenantId_idx" ON "estaciones_cocina"("tenantId");

-- CreateIndex
CREATE INDEX "ordenes_cocina_tenantId_idx" ON "ordenes_cocina"("tenantId");

-- CreateIndex
CREATE INDEX "ordenes_cocina_ventaId_idx" ON "ordenes_cocina"("ventaId");

-- CreateIndex
CREATE INDEX "ordenes_cocina_estacionId_idx" ON "ordenes_cocina"("estacionId");

-- CreateIndex
CREATE INDEX "ordenes_cocina_estado_idx" ON "ordenes_cocina"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_cocina_tenantId_numero_key" ON "ordenes_cocina"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "items_orden_cocina_ordenId_idx" ON "items_orden_cocina"("ordenId");

-- CreateIndex
CREATE INDEX "items_orden_cocina_productoId_idx" ON "items_orden_cocina"("productoId");

-- AddForeignKey
ALTER TABLE "estaciones_cocina" ADD CONSTRAINT "estaciones_cocina_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_cocina" ADD CONSTRAINT "ordenes_cocina_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_cocina" ADD CONSTRAINT "ordenes_cocina_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_cocina" ADD CONSTRAINT "ordenes_cocina_estacionId_fkey" FOREIGN KEY ("estacionId") REFERENCES "estaciones_cocina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_cocina" ADD CONSTRAINT "items_orden_cocina_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_cocina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_cocina" ADD CONSTRAINT "items_orden_cocina_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
