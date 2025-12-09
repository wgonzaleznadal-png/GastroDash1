/*
  Warnings:

  - A unique constraint covering the columns `[producto_vinculado_id]` on the table `ingredientes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ingredientes" ADD COLUMN     "producto_vinculado_id" TEXT;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "es_producto_intermedio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rendimiento" DECIMAL(10,3),
ADD COLUMN     "unidad_rendimiento" TEXT;

-- CreateTable
CREATE TABLE "recetas_ingredientes" (
    "id" TEXT NOT NULL,
    "ingrediente_id" TEXT NOT NULL,
    "ingrediente_componente_id" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recetas_ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recetas_ingredientes_ingrediente_id_idx" ON "recetas_ingredientes"("ingrediente_id");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_ingredientes_ingrediente_id_ingrediente_componente__key" ON "recetas_ingredientes"("ingrediente_id", "ingrediente_componente_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredientes_producto_vinculado_id_key" ON "ingredientes"("producto_vinculado_id");

-- AddForeignKey
ALTER TABLE "ingredientes" ADD CONSTRAINT "ingredientes_producto_vinculado_id_fkey" FOREIGN KEY ("producto_vinculado_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_ingredientes" ADD CONSTRAINT "recetas_ingredientes_ingrediente_id_fkey" FOREIGN KEY ("ingrediente_id") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_ingredientes" ADD CONSTRAINT "recetas_ingredientes_ingrediente_componente_id_fkey" FOREIGN KEY ("ingrediente_componente_id") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
