import { PrismaClient, TipoComprobante, EstadoComprobante, UnidadMedida } from '@prisma/client';
import { articuloService } from './articulo.service';

const prisma = new PrismaClient();

// ============================================
// TIPOS
// ============================================

export interface ItemComprobanteDTO {
  articuloId?: string;
  tipoArticulo?: string; // INGREDIENTE, PRODUCTO_DIRECTO, INSUMO, GASTO_SERVICIO
  categoria?: string; // ALIMENTOS, BEBIDAS_ALCOHOLICAS, BEBIDAS_SIN_ALCOHOL, LIMPIEZA, DESCARTABLES, UTENSILIOS, SERVICIOS
  marca?: string;
  descripcionOriginal: string;
  cantidad: number;
  unidad: UnidadMedida;
  precioUnitario: number;
  precioTotal: number;
  observaciones?: string;
}

export interface CreateComprobanteDTO {
  tipoComprobante: TipoComprobante;
  proveedorId?: string;
  fecha?: Date;
  numeroComprobante?: string;
  subtotal: number;
  impuestos?: number;
  descuentos?: number;
  total: number;
  observaciones?: string;
  imagenUrl?: string;
  items: ItemComprobanteDTO[];
}

export interface ComprobanteFilters {
  tipoComprobante?: TipoComprobante;
  estado?: EstadoComprobante;
  proveedorId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
}

export interface RecibirItemDTO {
  itemId: string;
  cantidadRecibida: number;
  observaciones?: string;
}

// ============================================
// SERVICIO DE COMPROBANTES
// ============================================

class ComprobanteService {

  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(tenantId: string, filters?: ComprobanteFilters) {
    const where: any = { tenantId };

    if (filters) {
      if (filters.tipoComprobante) where.tipoComprobante = filters.tipoComprobante;
      if (filters.estado) where.estado = filters.estado;
      if (filters.proveedorId) where.proveedorId = filters.proveedorId;
      
      if (filters.fechaDesde || filters.fechaHasta) {
        where.fecha = {};
        if (filters.fechaDesde) where.fecha.gte = filters.fechaDesde;
        if (filters.fechaHasta) where.fecha.lte = filters.fechaHasta;
      }

      if (filters.search) {
        where.OR = [
          { numeroComprobante: { contains: filters.search, mode: 'insensitive' } },
          { observaciones: { contains: filters.search, mode: 'insensitive' } },
          { proveedor: { nombre: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }
    }

    return prisma.comprobante.findMany({
      where,
      include: {
        proveedor: {
          select: { id: true, nombre: true }
        },
        usuario: {
          select: { id: true, nombre: true, apellido: true }
        },
        items: {
          include: {
            articulo: {
              select: { id: true, nombre: true, marca: true, tipo: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });
  }

  async getById(tenantId: string, id: string) {
    return prisma.comprobante.findFirst({
      where: { id, tenantId },
      include: {
        proveedor: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true }
        },
        items: {
          include: {
            articulo: true
          }
        }
      }
    });
  }

  async create(tenantId: string, usuarioId: string, data: CreateComprobanteDTO) {
    // Obtener el próximo número de comprobante
    const ultimoComprobante = await prisma.comprobante.findFirst({
      where: { tenantId },
      orderBy: { numero: 'desc' },
      select: { numero: true }
    });
    const numero = (ultimoComprobante?.numero || 0) + 1;

    // Verificar proveedor si se proporciona
    if (data.proveedorId) {
      const proveedor = await prisma.proveedor.findFirst({
        where: { id: data.proveedorId, tenantId }
      });
      if (!proveedor) {
        throw new Error('Proveedor no encontrado');
      }
    }

    // Procesar items: crear artículos si es necesario
    const itemsConArticulos = await Promise.all(
      data.items.map(async (item) => {
        let articuloId = item.articuloId;

        // Si viene tipoArticulo pero no articuloId, crear el artículo automáticamente
        if (item.tipoArticulo && !item.articuloId) {
          // Usar categoría del OCR o determinar por defecto según el tipo
          let categoria = item.categoria || 'OTROS';
          if (!item.categoria) {
            // Fallback si no viene categoría
            if (item.tipoArticulo === 'INGREDIENTE') categoria = 'ALIMENTOS';
            else if (item.tipoArticulo === 'GASTO_SERVICIO') categoria = 'SERVICIOS';
            // Para PRODUCTO_DIRECTO e INSUMO, el OCR debería detectar la categoría específica
          }

          // Determinar ubicación según categoría
          let ubicacion = 'DEPOSITO';
          if (['BEBIDAS_ALCOHOLICAS', 'BEBIDAS_SIN_ALCOHOL'].includes(categoria)) {
            ubicacion = 'BAR';
          } else if (categoria === 'ALIMENTOS' && item.tipoArticulo === 'INGREDIENTE') {
            ubicacion = 'COCINA';
          }

          // Crear el artículo
          const nuevoArticulo = await articuloService.create(tenantId, {
            nombre: item.descripcionOriginal,
            marca: item.marca, // Para productos directos (vinos, gaseosas)
            tipo: item.tipoArticulo as any,
            categoria: categoria as any,
            unidad: item.unidad,
            stockActual: 0,
            stockMinimo: 0,
            costoPromedio: item.precioUnitario,
            ubicacion: ubicacion as any,
            esGenerico: item.tipoArticulo === 'INGREDIENTE', // Ingredientes son genéricos (sin marca)
            afectaStock: item.tipoArticulo !== 'GASTO_SERVICIO',
            seVende: item.tipoArticulo === 'PRODUCTO_DIRECTO',
          });

          articuloId = nuevoArticulo.id;
        }

        return {
          articuloId,
          descripcionOriginal: item.descripcionOriginal,
          cantidad: item.cantidad,
          unidad: item.unidad,
          precioUnitario: item.precioUnitario,
          precioTotal: item.precioTotal,
          observaciones: item.observaciones
        };
      })
    );

    // Crear comprobante con items
    return prisma.comprobante.create({
      data: {
        tenantId,
        numero,
        tipoComprobante: data.tipoComprobante,
        proveedorId: data.proveedorId,
        fecha: data.fecha || new Date(),
        numeroComprobante: data.numeroComprobante,
        subtotal: data.subtotal,
        impuestos: data.impuestos || 0,
        descuentos: data.descuentos || 0,
        total: data.total,
        observaciones: data.observaciones,
        imagenUrl: data.imagenUrl,
        usuarioId,
        createdBy: usuarioId,
        items: {
          create: itemsConArticulos
        }
      },
      include: {
        proveedor: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true }
        },
        items: {
          include: {
            articulo: true
          }
        }
      }
    });
  }

  async update(tenantId: string, id: string, data: Partial<CreateComprobanteDTO>) {
    const existing = await prisma.comprobante.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      throw new Error('Comprobante no encontrado');
    }

    if (existing.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden editar comprobantes pendientes');
    }

    // Actualizar comprobante (sin items por ahora)
    const { items, ...comprobanteData } = data;

    return prisma.comprobante.update({
      where: { id },
      data: comprobanteData,
      include: {
        proveedor: true,
        items: {
          include: { articulo: true }
        }
      }
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await prisma.comprobante.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      throw new Error('Comprobante no encontrado');
    }

    if (existing.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden eliminar comprobantes pendientes');
    }

    return prisma.comprobante.delete({
      where: { id }
    });
  }

  // ============================================
  // RECEPCIÓN DE MERCADERÍA
  // ============================================

  async recibirComprobante(tenantId: string, id: string, items: RecibirItemDTO[]) {
    const comprobante = await prisma.comprobante.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: { articulo: true }
        }
      }
    });

    if (!comprobante) {
      throw new Error('Comprobante no encontrado');
    }

    if (comprobante.estado === 'RECIBIDO') {
      throw new Error('Este comprobante ya fue recibido completamente');
    }

    if (comprobante.estado === 'ANULADO') {
      throw new Error('No se puede recibir un comprobante anulado');
    }

    // Procesar cada item
    const ahora = new Date();
    let todosRecibidos = true;

    for (const itemRecibir of items) {
      const itemComprobante = comprobante.items.find(i => i.id === itemRecibir.itemId);
      
      if (!itemComprobante) {
        throw new Error(`Item ${itemRecibir.itemId} no encontrado en el comprobante`);
      }

      if (itemComprobante.estado === 'RECIBIDO') {
        continue; // Ya fue recibido
      }

      // Actualizar item
      await prisma.itemComprobante.update({
        where: { id: itemRecibir.itemId },
        data: {
          cantidadRecibida: itemRecibir.cantidadRecibida,
          fechaRecepcion: ahora,
          estado: 'RECIBIDO',
          observaciones: itemRecibir.observaciones
        }
      });

      // Actualizar stock del artículo si tiene uno asignado
      if (itemComprobante.articuloId && itemComprobante.articulo?.afectaStock) {
        await articuloService.actualizarStock(
          tenantId,
          itemComprobante.articuloId,
          itemRecibir.cantidadRecibida,
          'SUMAR',
          Number(itemComprobante.precioUnitario)
        );
      }
    }

    // Verificar si todos los items fueron recibidos
    const itemsActualizados = await prisma.itemComprobante.findMany({
      where: { comprobanteId: id }
    });

    todosRecibidos = itemsActualizados.every(i => i.estado === 'RECIBIDO');
    const algunoRecibido = itemsActualizados.some(i => i.estado === 'RECIBIDO');

    // Actualizar estado del comprobante
    let nuevoEstado: EstadoComprobante;
    if (todosRecibidos) {
      nuevoEstado = 'RECIBIDO';
    } else if (algunoRecibido) {
      nuevoEstado = 'PARCIAL';
    } else {
      nuevoEstado = 'PENDIENTE';
    }

    return prisma.comprobante.update({
      where: { id },
      data: { estado: nuevoEstado },
      include: {
        proveedor: true,
        items: {
          include: { articulo: true }
        }
      }
    });
  }

  // ============================================
  // ASIGNAR ARTÍCULO A ITEM
  // ============================================

  async asignarArticuloAItem(
    tenantId: string, 
    itemId: string, 
    articuloId: string,
    crearAlias: boolean = true
  ) {
    const item = await prisma.itemComprobante.findFirst({
      where: { id: itemId },
      include: {
        comprobante: true
      }
    });

    if (!item || item.comprobante.tenantId !== tenantId) {
      throw new Error('Item no encontrado');
    }

    const articulo = await prisma.articulo.findFirst({
      where: { id: articuloId, tenantId }
    });

    if (!articulo) {
      throw new Error('Artículo no encontrado');
    }

    // Actualizar item
    await prisma.itemComprobante.update({
      where: { id: itemId },
      data: { articuloId }
    });

    // Crear alias si se solicita (para futuras detecciones OCR)
    if (crearAlias && item.descripcionOriginal !== articulo.nombre) {
      try {
        await articuloService.agregarAlias(tenantId, articuloId, item.descripcionOriginal);
      } catch (e) {
        // Ignorar si el alias ya existe
      }
    }

    return prisma.itemComprobante.findFirst({
      where: { id: itemId },
      include: { articulo: true }
    });
  }

  // ============================================
  // ANULAR COMPROBANTE
  // ============================================

  async anularComprobante(tenantId: string, id: string, motivo: string) {
    const comprobante = await prisma.comprobante.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: { articulo: true }
        }
      }
    });

    if (!comprobante) {
      throw new Error('Comprobante no encontrado');
    }

    if (comprobante.estado === 'ANULADO') {
      throw new Error('El comprobante ya está anulado');
    }

    // Si ya se recibió mercadería, revertir stock
    if (comprobante.estado === 'RECIBIDO' || comprobante.estado === 'PARCIAL') {
      for (const item of comprobante.items) {
        if (item.estado === 'RECIBIDO' && item.articuloId && item.articulo?.afectaStock) {
          await articuloService.actualizarStock(
            tenantId,
            item.articuloId,
            Number(item.cantidadRecibida),
            'RESTAR'
          );
        }
      }
    }

    return prisma.comprobante.update({
      where: { id },
      data: {
        estado: 'ANULADO',
        observaciones: comprobante.observaciones 
          ? `${comprobante.observaciones}\n\nANULADO: ${motivo}`
          : `ANULADO: ${motivo}`
      }
    });
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async getEstadisticas(tenantId: string, fechaDesde?: Date, fechaHasta?: Date) {
    const where: any = { tenantId };
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = fechaDesde;
      if (fechaHasta) where.fecha.lte = fechaHasta;
    }

    const [
      total,
      porEstado,
      porTipo,
      montoTotal,
      porProveedor
    ] = await Promise.all([
      prisma.comprobante.count({ where }),
      prisma.comprobante.groupBy({
        by: ['estado'],
        where,
        _count: true
      }),
      prisma.comprobante.groupBy({
        by: ['tipoComprobante'],
        where,
        _count: true,
        _sum: { total: true }
      }),
      prisma.comprobante.aggregate({
        where: { ...where, estado: { not: 'ANULADO' } },
        _sum: { total: true }
      }),
      prisma.comprobante.groupBy({
        by: ['proveedorId'],
        where: { ...where, proveedorId: { not: null } },
        _count: true,
        _sum: { total: true }
      })
    ]);

    // Obtener nombres de proveedores
    const proveedorIds = porProveedor
      .filter(p => p.proveedorId)
      .map(p => p.proveedorId as string);
    
    const proveedores = await prisma.proveedor.findMany({
      where: { id: { in: proveedorIds } },
      select: { id: true, nombre: true }
    });

    const proveedorMap = new Map(proveedores.map(p => [p.id, p.nombre]));

    return {
      total,
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item._count;
        return acc;
      }, {} as Record<string, number>),
      porTipo: porTipo.map(item => ({
        tipo: item.tipoComprobante,
        cantidad: item._count,
        monto: Number(item._sum.total || 0)
      })),
      montoTotal: Number(montoTotal._sum.total || 0),
      porProveedor: porProveedor.map(item => ({
        proveedorId: item.proveedorId,
        proveedorNombre: proveedorMap.get(item.proveedorId!) || 'Sin proveedor',
        cantidad: item._count,
        monto: Number(item._sum.total || 0)
      }))
    };
  }
}

export const comprobanteService = new ComprobanteService();
