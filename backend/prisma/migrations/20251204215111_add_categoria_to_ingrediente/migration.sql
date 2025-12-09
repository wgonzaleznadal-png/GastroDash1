/*
  Warnings:

  - The values [KILOGRAMO,PORCION] on the enum `UnidadMedida` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `categoria` to the `ingredientes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategoriaIngrediente" AS ENUM ('ALIMENTOS', 'BEBIDAS', 'LIMPIEZA', 'DESCARTABLES', 'ARTICULOS_COCINA', 'VARIOS');

-- AlterEnum
BEGIN;
CREATE TYPE "UnidadMedida_new" AS ENUM ('KG', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'DOCENA', 'CAJA', 'BANDEJA', 'PAQUETE', 'BOLSA', 'LATA', 'BOTELLA', 'SOBRE', 'MAPLE');
ALTER TABLE "ingredientes" ALTER COLUMN "unidad" TYPE "UnidadMedida_new" USING ("unidad"::text::"UnidadMedida_new");
ALTER TABLE "recetas_ingredientes" ALTER COLUMN "unidad" TYPE "UnidadMedida_new" USING ("unidad"::text::"UnidadMedida_new");
ALTER TABLE "recetas" ALTER COLUMN "unidad" TYPE "UnidadMedida_new" USING ("unidad"::text::"UnidadMedida_new");
ALTER TABLE "items_compra" ALTER COLUMN "unidad" TYPE "UnidadMedida_new" USING ("unidad"::text::"UnidadMedida_new");
ALTER TYPE "UnidadMedida" RENAME TO "UnidadMedida_old";
ALTER TYPE "UnidadMedida_new" RENAME TO "UnidadMedida";
DROP TYPE "UnidadMedida_old";
COMMIT;

-- AlterTable
-- Agregar columna con valor por defecto temporal
ALTER TABLE "ingredientes" ADD COLUMN "categoria" "CategoriaIngrediente" NOT NULL DEFAULT 'VARIOS';
