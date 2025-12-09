import { PrismaClient, TipoMovimiento, MotivoMovimiento } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

interface MovimientoStockDTO {
  productoId: string;
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  cantidad: number;
  costoUnitario?: number;
  ventaId?: string;
  compraId?: string;
  notas?: string;
  lote?: string;
  fechaVencimiento?: Date;
}

interface AjusteInventarioDTO {
  motivo: string;
  observaciones?: string;
  detalles: {
    productoId: string;
    stockFisico: number;
    motivo?: string;
  }[];
}

interface ReporteInventarioOptions {
  categoriaId?: string;
  stockBajo?: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export class InventarioService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // MOVIMIENTOS DE STOCK
  // ============================================

  async registrarMovimiento(
    tenantId: string,
    usuarioId: string,
    data: MovimientoStockDTO
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Obtener producto actual
      const producto = await tx.producto.findFirst({
        where: {
          id: data.productoId,
          tenantId,
        },
      });

      if (!producto) {
        throw new AppError('Producto no encontrado', 404);
      }

      const stockAnterior = Number(producto.stock);
      let stockNuevo = stockAnterior;

      // Calcular nuevo stock según tipo de movimiento
      switch (data.tipo) {
        case 'ENTRADA':
          stockNuevo = stockAnterior + data.cantidad;
          break;
        case 'SALIDA':
          stockNuevo = stockAnterior - data.cantidad;
          if (stockNuevo < 0) {
            throw new AppError('Stock insuficiente', 400);
          }
          break;
        case 'AJUSTE':
          stockNuevo = data.cantidad; // El ajuste establece el stock directamente
          break;
        case 'MERMA':
        case 'DEVOLUCION':
        case 'TRANSFERENCIA':
          stockNuevo = stockAnterior - data.cantidad;
          break;
      }

      // Crear movimiento
      const movimiento = await tx.movimientoStock.create({
        data: {
          tenantId,
          productoId: data.productoId,
          tipo: data.tipo,
          motivo: data.motivo,
          cantidad: data.cantidad,
          stockAnterior,
          stockNuevo,
          costoUnitario: data.costoUnitario,
          costoTotal: data.costoUnitario ? data.costoUnitario * data.cantidad : null,
          ventaId: data.ventaId,
          compraId: data.compraId,
          usuarioId,
          notas: data.notas,
          lote: data.lote,
          fechaVencimiento: data.fechaVencimiento,
        },
      });

      // Actualizar stock del producto
      await tx.producto.update({
        where: { id: data.productoId },
        data: { stock: stockNuevo },
      });

      // Verificar alertas de stock bajo
      await this.verificarAlertasStock(tx, tenantId, data.productoId);

      return movimiento;
    });
  }

  async getMovimientos(
    tenantId: string,
    productoId?: string,
    fechaDesde?: Date,
    fechaHasta?: Date
  ) {
    const where: any = { tenantId };

    if (productoId) {
      where.productoId = productoId;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = fechaDesde;
      if (fechaHasta) where.createdAt.lte = fechaHasta;
    }

    return await this.prisma.movimientoStock.findMany({
      where,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            stock: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // AJUSTES DE INVENTARIO
  // ============================================

  async crearAjusteInventario(
    tenantId: string,
    usuarioId: string,
    data: AjusteInventarioDTO
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Obtener el siguiente número de ajuste
      const ultimoAjuste = await tx.ajusteInventario.findFirst({
        where: { tenantId },
        orderBy: { numero: 'desc' },
      });

      const numero = (ultimoAjuste?.numero || 0) + 1;

      // Crear ajuste
      const ajuste = await tx.ajusteInventario.create({
        data: {
          tenantId,
          numero,
          motivo: data.motivo,
          observaciones: data.observaciones,
          usuarioId,
          estado: 'PENDIENTE',
        },
      });

      // Crear detalles
      for (const detalle of data.detalles) {
        const producto = await tx.producto.findFirst({
          where: {
            id: detalle.productoId,
            tenantId,
          },
        });

        if (!producto) {
          throw new AppError(`Producto ${detalle.productoId} no encontrado`, 404);
        }

        const stockSistema = Number(producto.stock);
        const stockFisico = detalle.stockFisico;
        const diferencia = stockFisico - stockSistema;

        const costoUnitario = producto.costo ? Number(producto.costo) : 0;
        const valorDiferencia = diferencia * costoUnitario;

        await tx.detalleAjusteInventario.create({
          data: {
            ajusteId: ajuste.id,
            productoId: detalle.productoId,
            stockSistema,
            stockFisico,
            diferencia,
            costoUnitario,
            valorDiferencia,
            motivo: detalle.motivo,
          },
        });
      }

      return await tx.ajusteInventario.findUnique({
        where: { id: ajuste.id },
        include: {
          detalles: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      });
    });
  }

  async aprobarAjusteInventario(
    tenantId: string,
    ajusteId: string,
    usuarioId: string
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const ajuste = await tx.ajusteInventario.findFirst({
        where: {
          id: ajusteId,
          tenantId,
        },
        include: {
          detalles: true,
        },
      });

      if (!ajuste) {
        throw new AppError('Ajuste no encontrado', 404);
      }

      if (ajuste.estado !== 'PENDIENTE') {
        throw new AppError('El ajuste ya fue procesado', 400);
      }

      // Aplicar ajustes
      for (const detalle of ajuste.detalles) {
        if (detalle.diferencia !== 0) {
          // Registrar movimiento
          await this.registrarMovimiento(tenantId, usuarioId, {
            productoId: detalle.productoId,
            tipo: 'AJUSTE',
            motivo: 'AJUSTE_INVENTARIO',
            cantidad: Math.abs(Number(detalle.diferencia)),
            notas: `Ajuste de inventario #${ajuste.numero}`,
          });
        }
      }

      // Actualizar estado del ajuste
      return await tx.ajusteInventario.update({
        where: { id: ajusteId },
        data: {
          estado: 'APROBADO',
          aprobadoPor: usuarioId,
          fechaAprobacion: new Date(),
        },
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
        },
      });
    });
  }

  async getAjustesInventario(tenantId: string, estado?: string) {
    const where: any = { tenantId };
    if (estado) {
      where.estado = estado;
    }

    return await this.prisma.ajusteInventario.findMany({
      where,
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // ALERTAS DE STOCK
  // ============================================

  private async verificarAlertasStock(
    tx: any,
    tenantId: string,
    productoId: string
  ) {
    const producto = await tx.producto.findFirst({
      where: { id: productoId, tenantId },
    });

    if (!producto) return;

    const stock = Number(producto.stock);
    const stockMinimo = Number(producto.stockMinimo);

    // Limpiar alertas anteriores del mismo tipo
    await tx.alertaStock.deleteMany({
      where: {
        tenantId,
        productoId,
        tipo: { in: ['STOCK_BAJO', 'STOCK_CRITICO'] },
      },
    });

    // Crear nueva alerta si es necesario
    if (stock <= 0) {
      await tx.alertaStock.create({
        data: {
          tenantId,
          productoId,
          tipo: 'STOCK_CRITICO',
          mensaje: `${producto.nombre} está agotado`,
          nivel: 'CRITICO',
        },
      });
    } else if (stock <= stockMinimo) {
      await tx.alertaStock.create({
        data: {
          tenantId,
          productoId,
          tipo: 'STOCK_BAJO',
          mensaje: `${producto.nombre} tiene stock bajo (${stock} unidades)`,
          nivel: stock <= stockMinimo / 2 ? 'ALTO' : 'MEDIO',
        },
      });
    }
  }

  async getAlertas(tenantId: string, leida?: boolean) {
    const where: any = { tenantId };
    if (leida !== undefined) {
      where.leida = leida;
    }

    return await this.prisma.alertaStock.findMany({
      where,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            stock: true,
            stockMinimo: true,
          },
        },
      },
      orderBy: [{ nivel: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async marcarAlertaLeida(tenantId: string, alertaId: string) {
    return await this.prisma.alertaStock.update({
      where: { id: alertaId },
      data: {
        leida: true,
        fechaLeida: new Date(),
      },
    });
  }

  async marcarTodasAlertasLeidas(tenantId: string) {
    return await this.prisma.alertaStock.updateMany({
      where: {
        tenantId,
        leida: false,
      },
      data: {
        leida: true,
        fechaLeida: new Date(),
      },
    });
  }

  // ============================================
  // REPORTES
  // ============================================

  async getReporteInventario(tenantId: string, options: ReporteInventarioOptions = {}) {
    const where: any = { tenantId, disponible: true };

    if (options.categoriaId) {
      where.categoriaId = options.categoriaId;
    }

    const productos = await this.prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    // Filtrar por stock bajo si se solicita
    let productosFiltrados = productos;
    if (options.stockBajo) {
      productosFiltrados = productos.filter(
        (p) => Number(p.stock) <= Number(p.stockMinimo)
      );
    }

    // Calcular totales
    const valorTotal = productosFiltrados.reduce((sum, p) => {
      const stock = Number(p.stock);
      const costo = p.costo ? Number(p.costo) : 0;
      return sum + stock * costo;
    }, 0);

    const productosStockBajo = productos.filter(
      (p) => Number(p.stock) <= Number(p.stockMinimo) && Number(p.stock) > 0
    );

    const productosAgotados = productos.filter((p) => Number(p.stock) <= 0);

    return {
      productos: productosFiltrados,
      resumen: {
        totalProductos: productosFiltrados.length,
        valorTotal,
        productosStockBajo: productosStockBajo.length,
        productosAgotados: productosAgotados.length,
      },
    };
  }

  async getHistorialProducto(
    tenantId: string,
    productoId: string,
    fechaDesde?: Date,
    fechaHasta?: Date
  ) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, tenantId },
      include: {
        categoria: true,
      },
    });

    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    const movimientos = await this.getMovimientos(
      tenantId,
      productoId,
      fechaDesde,
      fechaHasta
    );

    return {
      producto,
      movimientos,
      stockActual: Number(producto.stock),
      stockMinimo: Number(producto.stockMinimo),
    };
  }
}
