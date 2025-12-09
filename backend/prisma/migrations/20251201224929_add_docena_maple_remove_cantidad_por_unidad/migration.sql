/*
  Warnings:

  - You are about to drop the column `cantidadPorUnidad` on the `ingredientes` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnidadMedida" ADD VALUE 'DOCENA';
ALTER TYPE "UnidadMedida" ADD VALUE 'MAPLE';

-- AlterTable
ALTER TABLE "ingredientes" DROP COLUMN "cantidadPorUnidad";
