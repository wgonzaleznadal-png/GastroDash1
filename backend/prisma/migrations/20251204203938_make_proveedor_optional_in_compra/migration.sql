-- DropForeignKey
ALTER TABLE "compras" DROP CONSTRAINT "compras_proveedorId_fkey";

-- AlterTable
ALTER TABLE "compras" ALTER COLUMN "proveedorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
