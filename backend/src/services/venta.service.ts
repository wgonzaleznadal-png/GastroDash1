import { PrismaClient, Venta } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface ItemVentaDTO {
  productoId: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

interface PagoDTO {
  metodo: 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'MERCADO_PAGO' | 'QR' | 'OTRO';
  monto: number;
  referencia?: string;
  notas?: string;
}

interface CreateVentaDTO {
  clienteId?: string;
  mesaId?: string;
  tipo: 'MOSTRADOR' | 'MESA' | 'DELIVERY' | 'ONLINE';
  compradorNombre?: string;
  compradorTelefono?: string;
  direccionEntrega?: string;
  estadoPago?: string;
  items: ItemVentaDTO[];
  subtotal: number;
  descuento?: number;
  propina?: number;
  total: number;
  pagos: PagoDTO[];
}

export class VentaService extends BaseRepository<Venta> {
  constructor() {
    super(prisma, 'venta');
  }

  async createVenta(tenantId: string, usuarioId: string, data: CreateVentaDTO) {
    // Validar stock de productos
    for (const item of data.items) {
      const producto = await prisma.producto.findFirst({
        where: {
          id: item.productoId,
          tenantId,
        },
      });

      if (!producto) {
        throw new AppError(`Producto no encontrado: ${item.productoId}`, 404);
      }

      if (producto.stock < item.cantidad) {
        throw new AppError(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
          400
        );
      }
    }

    // Crear venta con items en una transacción
    const venta = await prisma.$transaction(async (tx) => {
      // Obtener el siguiente número de venta
      const ultimaVenta = await tx.venta.findFirst({
        where: { tenantId },
        orderBy: { numero: 'desc' },
      });
      const numero = (ultimaVenta?.numero || 0) + 1;

      // Crear la venta
      const nuevaVenta = await tx.venta.create({
        data: {
          tenantId,
          usuarioId,
          numero,
          clienteId: data.clienteId,
          mesaId: data.mesaId,
          tipo: data.tipo,
          estado: 'CONFIRMADA',
          compradorNombre: data.compradorNombre,
          compradorTelefono: data.compradorTelefono,
          direccionEntrega: data.direccionEntrega,
          estadoPago: data.estadoPago || 'PENDIENTE',
          subtotal: data.subtotal,
          descuento: data.descuento || 0,
          propina: data.propina || 0,
          total: data.total,
          createdBy: usuarioId,
        },
      });

      // Crear items de venta y actualizar stock
      for (const item of data.items) {
        await tx.itemVenta.create({
          data: {
            ventaId: nuevaVenta.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.cantidad * item.precio,
            notas: item.notas,
          },
        });

        // Actualizar stock del producto
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        });
      }

      // Crear pagos
      for (const pago of data.pagos) {
        await tx.pago.create({
          data: {
            tenantId,
            ventaId: nuevaVenta.id,
            metodo: pago.metodo,
            monto: pago.monto,
            estado: 'APROBADO',
            referencia: pago.referencia,
            notas: pago.notas,
            createdBy: usuarioId,
          },
        });
      }

      // Si es una venta de mesa, actualizar estado de la mesa a OCUPADA
      if (data.mesaId) {
        await tx.mesa.update({
          where: { id: data.mesaId },
          data: { estado: 'OCUPADA' },
        });
      }

      // Crear orden de cocina automáticamente
      const ultimaOrdenCocina = await tx.ordenCocina.findFirst({
        where: { tenantId },
        orderBy: { numero: 'desc' },
      });
      const numeroOrden = (ultimaOrdenCocina?.numero || 0) + 1;

      const ordenCocina = await tx.ordenCocina.create({
        data: {
          tenantId,
          numero: numeroOrden,
          ventaId: nuevaVenta.id,
          prioridad: 'NORMAL',
          createdBy: usuarioId,
        },
      });

      // Crear items de la orden de cocina
      for (const item of data.items) {
        await tx.itemOrdenCocina.create({
          data: {
            ordenId: ordenCocina.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            notas: item.notas,
          },
        });
      }

      return nuevaVenta;
    });

    // Retornar venta con items
    return await this.getVentaById(tenantId, venta.id);
  }

  async getVentas(tenantId: string, filters?: {
    estado?: string;
    tipo?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const where: any = { tenantId };

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters?.fechaDesde || filters?.fechaHasta) {
      where.createdAt = {};
      if (filters.fechaDesde) {
        where.createdAt.gte = filters.fechaDesde;
      }
      if (filters.fechaHasta) {
        where.createdAt.lte = filters.fechaHasta;
      }
    }

    return await prisma.venta.findMany({
      where,
      include: {
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        pagos: {
          select: {
            id: true,
            metodo: true,
            monto: true,
            estado: true,
            createdAt: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        mesa: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getVentaById(tenantId: string, id: string) {
    const venta = await prisma.venta.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                precio: true,
              },
            },
          },
        },
        pagos: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        mesa: {
          select: {
            id: true,
            numero: true,
            sala: true,
          },
        },
      },
    });

    if (!venta) {
      throw new AppError('Venta no encontrada', 404);
    }

    return venta;
  }

  async cancelarVenta(tenantId: string, id: string) {
    const venta = await this.getVentaById(tenantId, id);

    if (venta.estado === 'CANCELADA') {
      throw new AppError('La venta ya está cancelada', 400);
    }

    // Cancelar venta y devolver stock en transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar estado de venta
      await tx.venta.update({
        where: { id },
        data: { estado: 'CANCELADA' },
      });

      // Devolver stock de productos
      for (const item of venta.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              increment: item.cantidad,
            },
          },
        });
      }
    });

    return await this.getVentaById(tenantId, id);
  }

  async getEstadisticas(tenantId: string, fechaDesde?: Date, fechaHasta?: Date) {
    const where: any = { tenantId, estado: { not: 'CANCELADA' } };

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = fechaDesde;
      if (fechaHasta) where.createdAt.lte = fechaHasta;
    }

    const [totalVentas, ventasCount, ventasPorTipo] = await Promise.all([
      prisma.venta.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.venta.count({ where }),
      prisma.venta.groupBy({
        by: ['tipo'],
        where,
        _count: true,
        _sum: { total: true },
      }),
    ]);

    return {
      totalVentas: totalVentas._sum.total || 0,
      cantidadVentas: ventasCount,
      ventasPorTipo,
      promedioVenta: ventasCount > 0 ? (totalVentas._sum.total || 0) / ventasCount : 0,
    };
  }
}
