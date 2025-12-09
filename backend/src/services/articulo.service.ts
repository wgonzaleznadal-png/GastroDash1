import { PrismaClient, TipoArticulo, CategoriaArticulo, UbicacionStock, UnidadMedida } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS
// ============================================

export interface CreateArticuloDTO {
  nombre: string;
  descripcion?: string;
  codigoInterno?: string;
  codigoBarras?: string;
  tipo: TipoArticulo;
  categoria: CategoriaArticulo;
  afectaStock?: boolean;
  stockActual?: number;
  stockMinimo?: number;
  unidad: UnidadMedida;
  ubicacion?: UbicacionStock;
  costoPromedio?: number;
  costoUltimo?: number;
  seVende?: boolean;
  precioVenta?: number;
  marca?: string;
  esGenerico?: boolean;
  articuloGenericoId?: string;
}

export interface UpdateArticuloDTO extends Partial<CreateArticuloDTO> {}

export interface ArticuloFilters {
  tipo?: TipoArticulo;
  categoria?: CategoriaArticulo;
  ubicacion?: UbicacionStock;
  activo?: boolean;
  seVende?: boolean;
  stockBajo?: boolean;
  search?: string;
}

// ============================================
// SERVICIO DE ARTÍCULOS
// ============================================

class ArticuloService {
  
  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(tenantId: string, filters?: ArticuloFilters) {
    const where: any = { tenantId };

    if (filters) {
      if (filters.tipo) where.tipo = filters.tipo;
      if (filters.categoria) where.categoria = filters.categoria;
      if (filters.ubicacion) where.ubicacion = filters.ubicacion;
      if (filters.activo !== undefined) where.activo = filters.activo;
      if (filters.seVende !== undefined) where.seVende = filters.seVende;
      
      if (filters.stockBajo) {
        where.stockActual = { lte: prisma.articulo.fields.stockMinimo };
      }
      
      if (filters.search) {
        where.OR = [
          { nombre: { contains: filters.search, mode: 'insensitive' } },
          { descripcion: { contains: filters.search, mode: 'insensitive' } },
          { codigoInterno: { contains: filters.search, mode: 'insensitive' } },
          { codigoBarras: { contains: filters.search, mode: 'insensitive' } },
          { marca: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return prisma.articulo.findMany({
      where,
      include: {
        articuloGenerico: {
          select: { id: true, nombre: true }
        },
        variantes: {
          select: { id: true, nombre: true, marca: true, stockActual: true }
        },
        aliasArticulos: {
          select: { alias: true }
        },
        _count: {
          select: {
            itemsComprobante: true,
            recetaItems: true,
            productosDirectos: true,
          }
        }
      },
      orderBy: [
        { tipo: 'asc' },
        { categoria: 'asc' },
        { nombre: 'asc' }
      ]
    });
  }

  async getById(tenantId: string, id: string) {
    return prisma.articulo.findFirst({
      where: { id, tenantId },
      include: {
        articuloGenerico: true,
        variantes: true,
        aliasArticulos: true,
        itemsComprobante: {
          take: 10,
          orderBy: { comprobante: { fecha: 'desc' } },
          include: {
            comprobante: {
              select: { numero: true, fecha: true, proveedor: { select: { nombre: true } } }
            }
          }
        },
        recetaItems: {
          include: {
            producto: { select: { id: true, nombre: true } }
          }
        },
        productosDirectos: {
          select: { id: true, nombre: true, precio: true }
        }
      }
    });
  }

  async create(tenantId: string, data: CreateArticuloDTO, createdBy?: string) {
    // Verificar si ya existe un artículo con el mismo nombre y marca
    const existing = await prisma.articulo.findFirst({
      where: {
        tenantId,
        nombre: data.nombre,
        marca: data.marca || null
      }
    });

    if (existing) {
      throw new Error(`Ya existe un artículo con el nombre "${data.nombre}"${data.marca ? ` y marca "${data.marca}"` : ''}`);
    }

    return prisma.articulo.create({
      data: {
        tenantId,
        ...data,
        createdBy
      }
    });
  }

  async update(tenantId: string, id: string, data: UpdateArticuloDTO) {
    // Verificar que existe
    const existing = await prisma.articulo.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      throw new Error('Artículo no encontrado');
    }

    // Si cambia nombre o marca, verificar duplicados
    if (data.nombre || data.marca !== undefined) {
      const duplicate = await prisma.articulo.findFirst({
        where: {
          tenantId,
          nombre: data.nombre || existing.nombre,
          marca: data.marca !== undefined ? data.marca : existing.marca,
          id: { not: id }
        }
      });

      if (duplicate) {
        throw new Error('Ya existe un artículo con ese nombre y marca');
      }
    }

    return prisma.articulo.update({
      where: { id },
      data
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await prisma.articulo.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            itemsComprobante: true,
            recetaItems: true,
            productosDirectos: true,
          }
        }
      }
    });

    if (!existing) {
      throw new Error('Artículo no encontrado');
    }

    // Verificar si tiene relaciones
    const totalRelaciones = 
      existing._count.itemsComprobante + 
      existing._count.recetaItems + 
      existing._count.productosDirectos;

    if (totalRelaciones > 0) {
      // Soft delete
      return prisma.articulo.update({
        where: { id },
        data: { activo: false }
      });
    }

    // Hard delete si no tiene relaciones
    return prisma.articulo.delete({
      where: { id }
    });
  }

  // ============================================
  // BÚSQUEDA INTELIGENTE (para OCR y autocompletado)
  // ============================================

  async buscarPorTexto(tenantId: string, texto: string) {
    // Primero buscar en alias
    const porAlias = await prisma.aliasArticulo.findFirst({
      where: {
        tenantId,
        alias: { equals: texto, mode: 'insensitive' }
      },
      include: { articulo: true }
    });

    if (porAlias) {
      return porAlias.articulo;
    }

    // Buscar por nombre exacto
    const porNombre = await prisma.articulo.findFirst({
      where: {
        tenantId,
        nombre: { equals: texto, mode: 'insensitive' }
      }
    });

    if (porNombre) {
      return porNombre;
    }

    // Buscar por nombre parcial
    const porNombreParcial = await prisma.articulo.findMany({
      where: {
        tenantId,
        OR: [
          { nombre: { contains: texto, mode: 'insensitive' } },
          { marca: { contains: texto, mode: 'insensitive' } },
          { descripcion: { contains: texto, mode: 'insensitive' } },
        ]
      },
      take: 5
    });

    return porNombreParcial;
  }

  // ============================================
  // ALIAS
  // ============================================

  async agregarAlias(tenantId: string, articuloId: string, alias: string) {
    // Verificar que el artículo existe
    const articulo = await prisma.articulo.findFirst({
      where: { id: articuloId, tenantId }
    });

    if (!articulo) {
      throw new Error('Artículo no encontrado');
    }

    // Verificar que el alias no existe
    const existingAlias = await prisma.aliasArticulo.findFirst({
      where: { tenantId, alias: { equals: alias, mode: 'insensitive' } }
    });

    if (existingAlias) {
      throw new Error('Este alias ya está asignado a otro artículo');
    }

    return prisma.aliasArticulo.create({
      data: {
        tenantId,
        articuloId,
        alias
      }
    });
  }

  async eliminarAlias(_tenantId: string, aliasId: string) {
    // tenantId se puede usar para validación adicional si es necesario
    return prisma.aliasArticulo.delete({
      where: { id: aliasId }
    });
  }

  // ============================================
  // STOCK
  // ============================================

  async actualizarStock(
    tenantId: string, 
    articuloId: string, 
    cantidad: number, 
    operacion: 'SUMAR' | 'RESTAR' | 'ESTABLECER',
    costoUnitario?: number
  ) {
    const articulo = await prisma.articulo.findFirst({
      where: { id: articuloId, tenantId }
    });

    if (!articulo) {
      throw new Error('Artículo no encontrado');
    }

    if (!articulo.afectaStock) {
      throw new Error('Este artículo no afecta stock');
    }

    let nuevoStock: number;
    const stockActual = Number(articulo.stockActual);

    switch (operacion) {
      case 'SUMAR':
        nuevoStock = stockActual + cantidad;
        break;
      case 'RESTAR':
        nuevoStock = stockActual - cantidad;
        if (nuevoStock < 0) {
          throw new Error('Stock insuficiente');
        }
        break;
      case 'ESTABLECER':
        nuevoStock = cantidad;
        break;
    }

    // Calcular nuevo costo promedio si se proporciona costo unitario
    let nuevoCostoPromedio = Number(articulo.costoPromedio);
    if (costoUnitario && operacion === 'SUMAR' && cantidad > 0) {
      const costoTotalAnterior = stockActual * Number(articulo.costoPromedio);
      const costoNuevo = cantidad * costoUnitario;
      nuevoCostoPromedio = (costoTotalAnterior + costoNuevo) / nuevoStock;
    }

    return prisma.articulo.update({
      where: { id: articuloId },
      data: {
        stockActual: nuevoStock,
        costoPromedio: nuevoCostoPromedio,
        costoUltimo: costoUnitario || articulo.costoUltimo
      }
    });
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  async getEstadisticas(tenantId: string) {
    const totalArticulos = await prisma.articulo.count({ 
      where: { tenantId, activo: true } 
    });

    const porTipo = await prisma.articulo.groupBy({
      by: ['tipo'],
      where: { tenantId, activo: true },
      _count: true
    });

    const porCategoria = await prisma.articulo.groupBy({
      by: ['categoria'],
      where: { tenantId, activo: true },
      _count: true
    });

    const sinStock = await prisma.articulo.count({
      where: {
        tenantId,
        activo: true,
        afectaStock: true,
        stockActual: 0
      }
    });

    // Para stock bajo, obtenemos todos y filtramos
    const articulosConStock = await prisma.articulo.findMany({
      where: {
        tenantId,
        activo: true,
        afectaStock: true,
        stockActual: { gt: 0 }
      },
      select: { stockActual: true, stockMinimo: true }
    });

    const stockBajo = articulosConStock.filter(
      a => Number(a.stockActual) <= Number(a.stockMinimo)
    ).length;

    return {
      totalArticulos,
      porTipo: porTipo.reduce((acc: Record<string, number>, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porCategoria: porCategoria.reduce((acc: Record<string, number>, item) => {
        acc[item.categoria] = item._count;
        return acc;
      }, {}),
      stockBajo,
      sinStock
    };
  }
}

export const articuloService = new ArticuloService();
