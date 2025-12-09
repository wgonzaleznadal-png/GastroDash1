import { PrismaClient, Compra, UnidadMedida, CategoriaIngrediente } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateCompraDTO {
  proveedorId?: string; // Ahora es opcional para compras sueltas
  numeroFactura?: string;
  fechaCompra?: Date;
  fechaEntrega?: Date;
  subtotal: number;
  impuestos?: number;
  descuentos?: number;
  total: number;
  observaciones?: string;
  items: {
    nombre: string;
    descripcion?: string;
    categoria: CategoriaIngrediente;
    unidad: UnidadMedida;
    cantidadComprada: number;
    precioUnitario: number;
    precioTotal: number;
    marca?: string;
    observaciones?: string;
  }[];
}

interface ReceiveCompraDTO {
  items: {
    itemId: string;
    cantidadRecibida: number;
  }[];
}

export class CompraService extends BaseRepository<Compra> {
  constructor() {
    super(prisma, 'compra');
  }

  async createCompra(tenantId: string, usuarioId: string, data: CreateCompraDTO) {
    // Verificar que el proveedor existe (solo si se proporciona)
    if (data.proveedorId) {
      const proveedor = await prisma.proveedor.findFirst({
        where: {
          id: data.proveedorId,
          tenantId,
        },
      });

      if (!proveedor) {
        throw new AppError('Proveedor no encontrado', 404);
      }
    }

    // Crear compra con items
    const compra = await prisma.$transaction(async (tx) => {
      // Obtener el siguiente número de compra
      const ultimaCompra = await tx.compra.findFirst({
        where: { tenantId },
        orderBy: { numero: 'desc' },
      });
      const numero = (ultimaCompra?.numero || 0) + 1;

      // Crear la compra
      const compraData: any = {
        tenantId,
        numero,
        usuarioId,
        numeroFactura: data.numeroFactura,
        fechaCompra: data.fechaCompra || new Date(),
        fechaEntrega: data.fechaEntrega,
        subtotal: data.subtotal,
        impuestos: data.impuestos || 0,
        descuentos: data.descuentos || 0,
        total: data.total,
        observaciones: data.observaciones,
        createdBy: usuarioId,
      };

      // Solo agregar proveedorId si existe
      if (data.proveedorId) {
        compraData.proveedorId = data.proveedorId;
      }

      const nuevaCompra = await tx.compra.create({
        data: compraData,
      });

      // Crear items de la compra
      for (const item of data.items) {
        // Buscar o crear el ingrediente
        let ingrediente = await tx.ingrediente.findFirst({
          where: {
            tenantId,
            nombre: item.nombre,
            activo: true,
          },
        });

        if (!ingrediente) {
          // Crear nuevo ingrediente
          ingrediente = await tx.ingrediente.create({
            data: {
              tenantId,
              nombre: item.nombre,
              descripcion: item.descripcion,
              categoria: item.categoria,
              unidad: item.unidad,
              costoPromedio: 0,
              costoUltimo: 0,
              stockActual: 0,
              stockMinimo: 0,
              activo: true,
            },
          });
        } else if (item.descripcion && !ingrediente.descripcion) {
          // Actualizar descripción si no existe
          ingrediente = await tx.ingrediente.update({
            where: { id: ingrediente.id },
            data: { descripcion: item.descripcion },
          });
        }

        await tx.itemCompra.create({
          data: {
            compraId: nuevaCompra.id,
            ingredienteId: ingrediente.id,
            marca: item.marca,
            cantidadComprada: item.cantidadComprada,
            unidad: item.unidad,
            precioUnitario: item.precioUnitario,
            precioTotal: item.precioTotal,
            observaciones: item.observaciones,
          },
        });
      }

      return nuevaCompra;
    });

    return await this.getCompraById(tenantId, compra.id);
  }

  async receiveCompra(tenantId: string, compraId: string, data: ReceiveCompraDTO) {
    const compra = await this.getCompraById(tenantId, compraId);

    if (compra.estado === 'RECIBIDA') {
      throw new AppError('La compra ya fue recibida completamente', 400);
    }

    await prisma.$transaction(async (tx) => {
      let todosRecibidos = true;

      for (const itemData of data.items) {
        const item = await tx.itemCompra.findFirst({
          where: {
            id: itemData.itemId,
            compraId,
          },
          include: {
            ingrediente: true,
          },
        });

        if (!item) {
          throw new AppError(`Item ${itemData.itemId} no encontrado`, 404);
        }

        // Actualizar item con cantidad recibida
        await tx.itemCompra.update({
          where: { id: itemData.itemId },
          data: {
            cantidadRecibida: itemData.cantidadRecibida,
            fechaRecepcion: new Date(),
          },
        });

        // Actualizar stock y costo promedio del ingrediente
        await this.updateIngredienteStockAndCost(
          tx,
          item.ingrediente.id,
          itemData.cantidadRecibida,
          Number(item.precioUnitario)
        );

        // Verificar si este item no fue recibido completamente
        if (itemData.cantidadRecibida < Number(item.cantidadComprada)) {
          todosRecibidos = false;
        }
      }

      // Actualizar estado de la compra
      const nuevoEstado = todosRecibidos ? 'RECIBIDA' : 'PARCIAL';
      await tx.compra.update({
        where: { id: compraId },
        data: { estado: nuevoEstado },
      });
    });

    return await this.getCompraById(tenantId, compraId);
  }

  /**
   * Actualiza el stock y costo promedio ponderado de un ingrediente
   * Fórmula: Costo Promedio = (Stock Actual * Costo Actual + Cantidad Nueva * Precio Nuevo) / (Stock Actual + Cantidad Nueva)
   */
  private async updateIngredienteStockAndCost(
    tx: any,
    ingredienteId: string,
    cantidadNueva: number,
    precioNuevo: number
  ) {
    const ingrediente = await tx.ingrediente.findUnique({
      where: { id: ingredienteId },
    });

    if (!ingrediente) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    const stockActual = Number(ingrediente.stockActual);
    const costoActual = Number(ingrediente.costoPromedio || 0);
    const cantidadNuevaNum = Number(cantidadNueva);
    const precioNuevoNum = Number(precioNuevo);

    // Calcular nuevo stock
    const nuevoStock = stockActual + cantidadNuevaNum;

    // Calcular costo promedio ponderado
    let nuevoCostoPromedio: number;
    
    if (stockActual === 0) {
      // Si no hay stock, el costo promedio es el precio nuevo
      nuevoCostoPromedio = precioNuevoNum;
    } else {
      // Fórmula de costo promedio ponderado
      nuevoCostoPromedio = 
        (stockActual * costoActual + cantidadNuevaNum * precioNuevoNum) / nuevoStock;
    }

    // Actualizar ingrediente
    await tx.ingrediente.update({
      where: { id: ingredienteId },
      data: {
        stockActual: nuevoStock,
        costoPromedio: nuevoCostoPromedio,
        costoUltimo: precioNuevoNum, // Precio de la última compra (para reposición)
      },
    });
  }

  async getCompras(tenantId: string, filters?: {
    estado?: string;
    proveedorId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const where: any = { tenantId };

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.proveedorId) {
      where.proveedorId = filters.proveedorId;
    }

    if (filters?.fechaDesde || filters?.fechaHasta) {
      where.fechaCompra = {};
      if (filters.fechaDesde) where.fechaCompra.gte = filters.fechaDesde;
      if (filters.fechaHasta) where.fechaCompra.lte = filters.fechaHasta;
    }

    return await prisma.compra.findMany({
      where,
      include: {
        proveedor: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        items: {
          include: {
            ingrediente: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
              },
            },
          },
        },
      },
      orderBy: { fechaCompra: 'desc' },
    });
  }

  async getCompraById(tenantId: string, id: string) {
    const compra = await prisma.compra.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        proveedor: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        items: {
          include: {
            ingrediente: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
              },
            },
          },
        },
      },
    });

    if (!compra) {
      throw new AppError('Compra no encontrada', 404);
    }

    return compra;
  }

  async updateCompra(tenantId: string, id: string, data: Partial<CreateCompraDTO>) {
    await this.getCompraById(tenantId, id);

    return await prisma.compra.update({
      where: { id },
      data: {
        numeroFactura: data.numeroFactura,
        fechaCompra: data.fechaCompra,
        fechaEntrega: data.fechaEntrega,
        observaciones: data.observaciones,
      },
      include: {
        proveedor: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        items: {
          include: {
            ingrediente: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
              },
            },
          },
        },
      },
    });
  }

  async cancelCompra(tenantId: string, id: string) {
    const compra = await this.getCompraById(tenantId, id);

    if (compra.estado === 'RECIBIDA') {
      throw new AppError('No se puede cancelar una compra ya recibida', 400);
    }

    return await prisma.compra.update({
      where: { id },
      data: { estado: 'CANCELADA' },
      include: {
        proveedor: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        items: {
          include: {
            ingrediente: {
              select: {
                id: true,
                nombre: true,
                unidad: true,
              },
            },
          },
        },
      },
    });
  }

  async getEstadisticas(tenantId: string, fechaDesde?: Date, fechaHasta?: Date) {
    const where: any = { tenantId };

    if (fechaDesde || fechaHasta) {
      where.fechaCompra = {};
      if (fechaDesde) where.fechaCompra.gte = fechaDesde;
      if (fechaHasta) where.fechaCompra.lte = fechaHasta;
    }

    const [total, pendientes, recibidas, parciales, canceladas, montoTotal] = 
      await Promise.all([
        prisma.compra.count({ where }),
        prisma.compra.count({ where: { ...where, estado: 'PENDIENTE' } }),
        prisma.compra.count({ where: { ...where, estado: 'RECIBIDA' } }),
        prisma.compra.count({ where: { ...where, estado: 'PARCIAL' } }),
        prisma.compra.count({ where: { ...where, estado: 'CANCELADA' } }),
        prisma.compra.aggregate({
          where: { ...where, estado: { not: 'CANCELADA' } },
          _sum: { total: true },
        }),
      ]);

    return {
      total,
      pendientes,
      recibidas,
      parciales,
      canceladas,
      montoTotal: montoTotal._sum.total || 0,
    };
  }
}
