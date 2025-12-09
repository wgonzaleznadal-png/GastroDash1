-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'DEVOLUCION', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "MotivoMovimiento" AS ENUM ('COMPRA', 'VENTA', 'AJUSTE_INVENTARIO', 'PRODUCTO_VENCIDO', 'PRODUCTO_DANADO', 'ROBO', 'DONACION', 'PRODUCCION', 'CONSUMO_INTERNO', 'DEVOLUCION_PROVEEDOR', 'DEVOLUCION_CLIENTE', 'TRANSFERENCIA_SUCURSAL', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('POR_COBRAR', 'POR_PAGAR');

-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('OPERATIVO', 'ADMINISTRATIVO', 'MARKETING', 'MANTENIMIENTO', 'SERVICIOS', 'IMPUESTOS', 'SALARIOS', 'OTRO');

-- AlterTable
ALTER TABLE "mesas" ADD COLUMN     "forma" TEXT DEFAULT 'CUADRADA',
ADD COLUMN     "meseroId" TEXT,
ADD COLUMN     "posicionX" INTEGER,
ADD COLUMN     "posicionY" INTEGER;

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "motivo" "MotivoMovimiento" NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "stockAnterior" DECIMAL(10,3) NOT NULL,
    "stockNuevo" DECIMAL(10,3) NOT NULL,
    "costoUnitario" DECIMAL(10,2),
    "costoTotal" DECIMAL(10,2),
    "ventaId" TEXT,
    "compraId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "notas" TEXT,
    "lote" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_inventario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "usuarioId" TEXT NOT NULL,
    "aprobadoPor" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajustes_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_ajuste_inventario" (
    "id" TEXT NOT NULL,
    "ajusteId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "stockSistema" DECIMAL(10,3) NOT NULL,
    "stockFisico" DECIMAL(10,3) NOT NULL,
    "diferencia" DECIMAL(10,3) NOT NULL,
    "costoUnitario" DECIMAL(10,2),
    "valorDiferencia" DECIMAL(10,2),
    "motivo" TEXT,

    CONSTRAINT "detalles_ajuste_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_stock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "nivel" TEXT NOT NULL DEFAULT 'MEDIO',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaLeida" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "nombreCliente" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "cantidadPersonas" INTEGER NOT NULL,
    "fechaReserva" TIMESTAMP(3) NOT NULL,
    "horaReserva" TEXT NOT NULL,
    "duracionEstimada" INTEGER NOT NULL DEFAULT 120,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADA',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_entrega" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "costoEnvio" DECIMAL(10,2) NOT NULL,
    "tiempoEstimado" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "coordenadas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "zonaId" TEXT,
    "cadeteId" TEXT,
    "direccion" TEXT NOT NULL,
    "referencia" TEXT,
    "coordenadas" JSONB,
    "costoEnvio" DECIMAL(10,2) NOT NULL,
    "tiempoEstimado" INTEGER NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "horaAsignacion" TIMESTAMP(3),
    "horaSalida" TIMESTAMP(3),
    "horaEntrega" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "numero" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'PENDIENTE',
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT,
    "proveedorId" TEXT,
    "ventaId" TEXT,
    "compraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_cuenta" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoGasto" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "centroCosto" TEXT,
    "categoria" TEXT,
    "comprobante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flujo_caja" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concepto" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodoPago" "MetodoPago",
    "referencia" TEXT,
    "ventaId" TEXT,
    "gastoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flujo_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presupuestos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "montoPresupuestado" DECIMAL(10,2) NOT NULL,
    "montoEjecutado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_stock_tenantId_productoId_idx" ON "movimientos_stock"("tenantId", "productoId");

-- CreateIndex
CREATE INDEX "movimientos_stock_tenantId_tipo_idx" ON "movimientos_stock"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "movimientos_stock_tenantId_createdAt_idx" ON "movimientos_stock"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "movimientos_stock_productoId_createdAt_idx" ON "movimientos_stock"("productoId", "createdAt");

-- CreateIndex
CREATE INDEX "ajustes_inventario_tenantId_estado_idx" ON "ajustes_inventario"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "ajustes_inventario_tenantId_fecha_idx" ON "ajustes_inventario"("tenantId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ajustes_inventario_tenantId_numero_key" ON "ajustes_inventario"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "detalles_ajuste_inventario_ajusteId_idx" ON "detalles_ajuste_inventario"("ajusteId");

-- CreateIndex
CREATE INDEX "detalles_ajuste_inventario_productoId_idx" ON "detalles_ajuste_inventario"("productoId");

-- CreateIndex
CREATE INDEX "alertas_stock_tenantId_leida_idx" ON "alertas_stock"("tenantId", "leida");

-- CreateIndex
CREATE INDEX "alertas_stock_tenantId_nivel_idx" ON "alertas_stock"("tenantId", "nivel");

-- CreateIndex
CREATE INDEX "alertas_stock_productoId_idx" ON "alertas_stock"("productoId");

-- CreateIndex
CREATE INDEX "reservas_tenantId_fechaReserva_idx" ON "reservas"("tenantId", "fechaReserva");

-- CreateIndex
CREATE INDEX "reservas_tenantId_estado_idx" ON "reservas"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "reservas_mesaId_idx" ON "reservas"("mesaId");

-- CreateIndex
CREATE INDEX "zonas_entrega_tenantId_activo_idx" ON "zonas_entrega"("tenantId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_ventaId_key" ON "pedidos"("ventaId");

-- CreateIndex
CREATE INDEX "pedidos_tenantId_estado_idx" ON "pedidos"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "pedidos_cadeteId_idx" ON "pedidos"("cadeteId");

-- CreateIndex
CREATE INDEX "pedidos_ventaId_idx" ON "pedidos"("ventaId");

-- CreateIndex
CREATE INDEX "cuentas_tenantId_tipo_estado_idx" ON "cuentas"("tenantId", "tipo", "estado");

-- CreateIndex
CREATE INDEX "cuentas_tenantId_fechaVencimiento_idx" ON "cuentas"("tenantId", "fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_tenantId_tipo_numero_key" ON "cuentas"("tenantId", "tipo", "numero");

-- CreateIndex
CREATE INDEX "pagos_cuenta_cuentaId_idx" ON "pagos_cuenta"("cuentaId");

-- CreateIndex
CREATE INDEX "gastos_tenantId_tipo_idx" ON "gastos"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "gastos_tenantId_fecha_idx" ON "gastos"("tenantId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "gastos_tenantId_numero_key" ON "gastos"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "flujo_caja_tenantId_fecha_idx" ON "flujo_caja"("tenantId", "fecha");

-- CreateIndex
CREATE INDEX "flujo_caja_tenantId_tipo_idx" ON "flujo_caja"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "presupuestos_tenantId_periodo_idx" ON "presupuestos"("tenantId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_tenantId_periodo_tipo_categoria_key" ON "presupuestos"("tenantId", "periodo", "tipo", "categoria");

-- CreateIndex
CREATE INDEX "mesas_meseroId_idx" ON "mesas"("meseroId");

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "ajustes_inventario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_inventario" ADD CONSTRAINT "ajustes_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ajuste_inventario" ADD CONSTRAINT "detalles_ajuste_inventario_ajusteId_fkey" FOREIGN KEY ("ajusteId") REFERENCES "ajustes_inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_ajuste_inventario" ADD CONSTRAINT "detalles_ajuste_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_stock" ADD CONSTRAINT "alertas_stock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_stock" ADD CONSTRAINT "alertas_stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_meseroId_fkey" FOREIGN KEY ("meseroId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas_entrega" ADD CONSTRAINT "zonas_entrega_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zonas_entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cadeteId_fkey" FOREIGN KEY ("cadeteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuenta" ADD CONSTRAINT "pagos_cuenta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flujo_caja" ADD CONSTRAINT "flujo_caja_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
