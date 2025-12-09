-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'PORCION');

-- CreateTable
CREATE TABLE "ingredientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "costo" DECIMAL(10,2) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "stockActual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingredientes_tenantId_activo_idx" ON "ingredientes"("tenantId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "ingredientes_tenantId_nombre_key" ON "ingredientes"("tenantId", "nombre");

-- CreateIndex
CREATE INDEX "recetas_productoId_idx" ON "recetas"("productoId");

-- CreateIndex
CREATE INDEX "recetas_ingredienteId_idx" ON "recetas"("ingredienteId");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_productoId_ingredienteId_key" ON "recetas"("productoId", "ingredienteId");

-- AddForeignKey
ALTER TABLE "ingredientes" ADD CONSTRAINT "ingredientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
