import { PrismaClient, Producto } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';
import { productoIntermedioService } from './producto-intermedio.service';

const prisma = new PrismaClient();

interface CreateProductoDTO {
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  porcentajeImpuestos?: number;
  porcentajeBeneficio?: number;
  porcentajeOtros?: number;
  calcularPrecioAutomatico?: boolean;
  stock: number;
  stockMinimo: number;
  codigoBarras?: string;
  imagen?: string;
  disponible?: boolean;
  // Producto Intermedio
  esProductoIntermedio?: boolean;
  rendimiento?: number;
  unidadRendimiento?: string;
}

interface UpdateProductoDTO extends Partial<CreateProductoDTO> {}

export class ProductoService extends BaseRepository<Producto> {
  constructor() {
    super(prisma, 'producto');
  }

  private calcularPrecioVenta(
    costo: number,
    porcentajeImpuestos: number = 0,
    porcentajeBeneficio: number = 0,
    porcentajeOtros: number = 0
  ): number {
    // Cálculo: Costo + (Costo * Impuestos%) + (Costo * Beneficio%) + (Costo * Otros%)
    const impuestos = costo * (porcentajeImpuestos / 100);
    const beneficio = costo * (porcentajeBeneficio / 100);
    const otros = costo * (porcentajeOtros / 100);
    
    return Math.round(costo + impuestos + beneficio + otros);
  }

  async createProducto(tenantId: string, data: CreateProductoDTO): Promise<Producto> {
    // Verificar que la categoría existe y pertenece al tenant
    const categoria = await prisma.categoria.findFirst({
      where: {
        id: data.categoriaId,
        tenantId,
      },
    });

    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
    }

    // Verificar si ya existe un producto con el mismo nombre
    const existingProducto = await prisma.producto.findFirst({
      where: {
        tenantId,
        nombre: data.nombre,
      },
    });

    if (existingProducto) {
      throw new AppError('Ya existe un producto con ese nombre', 400);
    }

    // Calcular precio automáticamente si está habilitado
    let precioFinal = data.precio;
    if (data.calcularPrecioAutomatico && data.costo) {
      precioFinal = this.calcularPrecioVenta(
        data.costo,
        data.porcentajeImpuestos,
        data.porcentajeBeneficio,
        data.porcentajeOtros
      );
    }

    // Filtrar solo los campos que existen en el modelo Prisma
    const productoData: any = {
      categoriaId: data.categoriaId,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: precioFinal,
      costo: data.costo,
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      disponible: data.disponible ?? true,
      esProductoIntermedio: data.esProductoIntermedio ?? false,
      rendimiento: data.rendimiento,
      unidadRendimiento: data.unidadRendimiento,
    };

    const producto = await this.create(tenantId, productoData);

    // Si es producto intermedio, crear ingrediente vinculado
    if (data.esProductoIntermedio && data.rendimiento && data.unidadRendimiento) {
      try {
        await productoIntermedioService.crearIngredienteVinculado(tenantId, producto.id);
      } catch (error) {
        console.error('Error al crear ingrediente vinculado:', error);
        // No fallar la creación del producto si falla el ingrediente
      }
    }

    return producto;
  }

  async updateProducto(
    tenantId: string,
    id: string,
    data: UpdateProductoDTO
  ): Promise<Producto> {
    // Si se está actualizando la categoría, verificar que existe
    if (data.categoriaId) {
      const categoria = await prisma.categoria.findFirst({
        where: {
          id: data.categoriaId,
          tenantId,
        },
      });

      if (!categoria) {
        throw new AppError('Categoría no encontrada', 404);
      }
    }

    // Si se está actualizando el nombre, verificar que no exista otro producto con ese nombre
    if (data.nombre) {
      const existingProducto = await prisma.producto.findFirst({
        where: {
          tenantId,
          nombre: data.nombre,
          id: { not: id },
        },
      });

      if (existingProducto) {
        throw new AppError('Ya existe un producto con ese nombre', 400);
      }
    }

    // Calcular precio automáticamente si está habilitado
    let precioFinal = data.precio;
    if (data.calcularPrecioAutomatico && data.costo) {
      precioFinal = this.calcularPrecioVenta(
        data.costo,
        data.porcentajeImpuestos,
        data.porcentajeBeneficio,
        data.porcentajeOtros
      );
    }

    // Filtrar solo los campos que existen en el modelo Prisma
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (precioFinal !== undefined) updateData.precio = precioFinal;
    if (data.costo !== undefined) updateData.costo = data.costo;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.stockMinimo !== undefined) updateData.stockMinimo = data.stockMinimo;
    if (data.disponible !== undefined) updateData.disponible = data.disponible;
    if (data.categoriaId !== undefined) updateData.categoriaId = data.categoriaId;
    if (data.esProductoIntermedio !== undefined) updateData.esProductoIntermedio = data.esProductoIntermedio;
    if (data.rendimiento !== undefined) updateData.rendimiento = data.rendimiento;
    if (data.unidadRendimiento !== undefined) updateData.unidadRendimiento = data.unidadRendimiento;

    // Actualizar usando Prisma directamente
    const producto = await prisma.producto.update({
      where: { id },
      data: updateData,
    });

    // Si es producto intermedio, actualizar ingrediente vinculado
    if (producto.esProductoIntermedio && producto.rendimiento && producto.unidadRendimiento) {
      try {
        await productoIntermedioService.crearIngredienteVinculado(tenantId, producto.id);
      } catch (error) {
        console.error('Error al actualizar ingrediente vinculado:', error);
      }
    } else if (!producto.esProductoIntermedio) {
      // Si dejó de ser producto intermedio, eliminar ingrediente vinculado
      try {
        await productoIntermedioService.eliminarIngredienteVinculado(producto.id);
      } catch (error) {
        console.error('Error al eliminar ingrediente vinculado:', error);
      }
    }

    return producto;
  }

  async getProductos(tenantId: string, filters?: {
    categoriaId?: string;
    disponible?: boolean;
    search?: string;
  }) {
    const where: any = { tenantId };

    if (filters?.categoriaId) {
      where.categoriaId = filters.categoriaId;
    }

    if (filters?.disponible !== undefined) {
      where.disponible = filters.disponible;
    }

    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
        { codigoBarras: { contains: filters.search } },
      ];
    }

    return await prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async getProductoById(tenantId: string, id: string) {
    const producto = await prisma.producto.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    return producto;
  }

  async deleteProducto(tenantId: string, id: string): Promise<void> {
    // Verificar si el producto tiene ventas asociadas
    const ventasCount = await prisma.itemVenta.count({
      where: {
        productoId: id,
      },
    });

    if (ventasCount > 0) {
      throw new AppError(
        'No se puede eliminar el producto porque tiene ventas asociadas',
        400
      );
    }

    await this.delete(tenantId, id);
  }

  async updateStock(tenantId: string, id: string, cantidad: number): Promise<Producto> {
    const producto = await this.getProductoById(tenantId, id);

    const nuevoStock = producto.stock + cantidad;

    if (nuevoStock < 0) {
      throw new AppError('Stock insuficiente', 400);
    }

    return await this.update(tenantId, id, {
      stock: nuevoStock,
    });
  }

  async getProductosBajoStock(tenantId: string) {
    return await prisma.producto.findMany({
      where: {
        tenantId,
        stock: {
          lte: prisma.producto.fields.stockMinimo,
        },
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });
  }
}
