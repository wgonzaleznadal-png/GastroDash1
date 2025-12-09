import { PrismaClient, OrdenCocina, EstadoOrdenCocina, PrioridadOrden } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateOrdenCocinaDTO {
  ventaId: string;
  estacionId?: string;
  prioridad?: PrioridadOrden;
  tiempoEstimado?: number;
  notas?: string;
}

interface UpdateEstadoOrdenDTO {
  estado: EstadoOrdenCocina;
  notas?: string;
}

export class CocinaService extends BaseRepository<OrdenCocina> {
  constructor() {
    super(prisma, 'ordenCocina');
  }

  async createOrdenCocina(tenantId: string, usuarioId: string, data: CreateOrdenCocinaDTO) {
    // Verificar que la venta existe
    const venta = await prisma.venta.findFirst({
      where: {
        id: data.ventaId,
        tenantId,
      },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!venta) {
      throw new AppError('Venta no encontrada', 404);
    }

    // Verificar si ya existe una orden para esta venta
    const ordenExistente = await prisma.ordenCocina.findFirst({
      where: {
        ventaId: data.ventaId,
        tenantId,
      },
    });

    if (ordenExistente) {
      throw new AppError('Ya existe una orden de cocina para esta venta', 400);
    }

    // Crear orden de cocina con items
    const orden = await prisma.$transaction(async (tx) => {
      // Obtener el siguiente número de orden
      const ultimaOrden = await tx.ordenCocina.findFirst({
        where: { tenantId },
        orderBy: { numero: 'desc' },
      });
      const numero = (ultimaOrden?.numero || 0) + 1;

      // Crear la orden
      const nuevaOrden = await tx.ordenCocina.create({
        data: {
          tenantId,
          numero,
          ventaId: data.ventaId,
          estacionId: data.estacionId,
          prioridad: data.prioridad || 'NORMAL',
          tiempoEstimado: data.tiempoEstimado,
          notas: data.notas,
          createdBy: usuarioId,
        },
      });

      // Crear items de la orden
      for (const item of venta.items) {
        await tx.itemOrdenCocina.create({
          data: {
            ordenId: nuevaOrden.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            notas: item.notas,
          },
        });
      }

      return nuevaOrden;
    });

    return await this.getOrdenById(tenantId, orden.id);
  }

  async getOrdenes(tenantId: string, filters?: {
    estado?: EstadoOrdenCocina;
    estacionId?: string;
    prioridad?: PrioridadOrden;
  }) {
    const where: any = { tenantId };

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.estacionId) {
      where.estacionId = filters.estacionId;
    }

    if (filters?.prioridad) {
      where.prioridad = filters.prioridad;
    }

    return await prisma.ordenCocina.findMany({
      where,
      include: {
        venta: {
          include: {
            mesa: true,
          },
        },
        estacion: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: [
        { prioridad: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async getOrdenById(tenantId: string, id: string) {
    const orden = await prisma.ordenCocina.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        venta: {
          include: {
            mesa: true,
            items: {
              include: {
                producto: true,
              },
            },
          },
        },
        estacion: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!orden) {
      throw new AppError('Orden de cocina no encontrada', 404);
    }

    return orden;
  }

  async updateEstado(tenantId: string, id: string, data: UpdateEstadoOrdenDTO) {
    const orden = await this.getOrdenById(tenantId, id);

    const updateData: any = {
      estado: data.estado,
      notas: data.notas,
    };

    // Si cambia a EN_PREPARACION, registrar tiempo de inicio
    if (data.estado === 'EN_PREPARACION' && !orden.tiempoInicio) {
      updateData.tiempoInicio = new Date();
    }

    // Si cambia a LISTO o ENTREGADO, registrar tiempo de fin y calcular total
    if ((data.estado === 'LISTO' || data.estado === 'ENTREGADO') && !orden.tiempoFin) {
      updateData.tiempoFin = new Date();
      
      if (orden.tiempoInicio) {
        const tiempoTotal = Math.floor(
          (new Date().getTime() - new Date(orden.tiempoInicio).getTime()) / 60000
        );
        updateData.tiempoTotal = tiempoTotal;
      }
    }

    return await prisma.ordenCocina.update({
      where: { id },
      data: updateData,
      include: {
        venta: {
          include: {
            mesa: true,
          },
        },
        estacion: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async updatePrioridad(tenantId: string, id: string, prioridad: PrioridadOrden) {
    await this.getOrdenById(tenantId, id);

    return await prisma.ordenCocina.update({
      where: { id },
      data: { prioridad },
      include: {
        venta: {
          include: {
            mesa: true,
          },
        },
        estacion: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  async marcarImpreso(tenantId: string, id: string) {
    await this.getOrdenById(tenantId, id);

    return await prisma.ordenCocina.update({
      where: { id },
      data: { impreso: true },
    });
  }

  async marcarNotificado(tenantId: string, id: string) {
    await this.getOrdenById(tenantId, id);

    return await prisma.ordenCocina.update({
      where: { id },
      data: { notificado: true },
    });
  }

  async getEstadisticas(tenantId: string, fechaDesde?: Date, fechaHasta?: Date) {
    const where: any = { tenantId };

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = fechaDesde;
      if (fechaHasta) where.createdAt.lte = fechaHasta;
    }

    const [total, pendientes, enPreparacion, listas, entregadas, canceladas, tiempoPromedio] = 
      await Promise.all([
        prisma.ordenCocina.count({ where }),
        prisma.ordenCocina.count({ where: { ...where, estado: 'PENDIENTE' } }),
        prisma.ordenCocina.count({ where: { ...where, estado: 'EN_PREPARACION' } }),
        prisma.ordenCocina.count({ where: { ...where, estado: 'LISTO' } }),
        prisma.ordenCocina.count({ where: { ...where, estado: 'ENTREGADO' } }),
        prisma.ordenCocina.count({ where: { ...where, estado: 'CANCELADO' } }),
        prisma.ordenCocina.aggregate({
          where: { ...where, tiempoTotal: { not: null } },
          _avg: { tiempoTotal: true },
        }),
      ]);

    return {
      total,
      pendientes,
      enPreparacion,
      listas,
      entregadas,
      canceladas,
      tiempoPromedio: tiempoPromedio._avg.tiempoTotal || 0,
    };
  }

  // Estaciones de Cocina
  async createEstacion(tenantId: string, usuarioId: string, data: {
    nombre: string;
    descripcion?: string;
    color?: string;
    orden?: number;
  }) {
    return await prisma.estacionCocina.create({
      data: {
        tenantId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        color: data.color,
        orden: data.orden || 0,
        createdBy: usuarioId,
      },
    });
  }

  async getEstaciones(tenantId: string) {
    return await prisma.estacionCocina.findMany({
      where: { tenantId, activo: true },
      orderBy: { orden: 'asc' },
    });
  }

  async updateEstacion(tenantId: string, id: string, data: {
    nombre?: string;
    descripcion?: string;
    color?: string;
    orden?: number;
    activo?: boolean;
  }) {
    const estacion = await prisma.estacionCocina.findFirst({
      where: { id, tenantId },
    });

    if (!estacion) {
      throw new AppError('Estación no encontrada', 404);
    }

    return await prisma.estacionCocina.update({
      where: { id },
      data,
    });
  }

  async deleteEstacion(tenantId: string, id: string) {
    const estacion = await prisma.estacionCocina.findFirst({
      where: { id, tenantId },
    });

    if (!estacion) {
      throw new AppError('Estación no encontrada', 404);
    }

    return await prisma.estacionCocina.update({
      where: { id },
      data: { activo: false },
    });
  }
}
