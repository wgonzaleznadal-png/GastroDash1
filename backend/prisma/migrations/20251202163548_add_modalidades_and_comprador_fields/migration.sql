-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "modalidades" JSONB NOT NULL DEFAULT '["MOSTRADOR", "MESA", "DELIVERY", "ONLINE"]';

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "compradorNombre" TEXT,
ADD COLUMN     "compradorTelefono" TEXT,
ADD COLUMN     "direccionEntrega" TEXT,
ADD COLUMN     "estadoPago" TEXT NOT NULL DEFAULT 'PENDIENTE';
