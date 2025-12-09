import { PrismaClient, Ingrediente, UnidadMedida } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateIngredienteDTO {
  nombre: string;
  descripcion?: string;
  costo: number;
  unidad: UnidadMedida;
  stockActual?: number;
  stockMinimo?: number;
  activo?: boolean;
}

interface UpdateIngredienteDTO extends Partial<CreateIngredienteDTO> {}

export class IngredienteService extends BaseRepository<Ingrediente> {
  constructor() {
    super(prisma, 'ingrediente');
  }

  async createIngrediente(tenantId: string, data: CreateIngredienteDTO): Promise<Ingrediente> {
    const existingIngrediente = await prisma.ingrediente.findFirst({
      where: {
        tenantId,
        nombre: data.nombre,
      },
    });

    if (existingIngrediente) {
      throw new AppError('Ya existe un ingrediente con ese nombre', 400);
    }

    return await this.create(tenantId, {
      ...data,
      stockActual: data.stockActual ?? 0,
      stockMinimo: data.stockMinimo ?? 0,
      activo: data.activo ?? true,
    });
  }

  async getIngredientes(tenantId: string, filters?: {
    activo?: boolean;
    search?: string;
  }) {
    const where: any = { tenantId };

    if (filters?.activo !== undefined) {
      where.activo = filters.activo;
    }

    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { descripcion: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.ingrediente.findMany({
      where,
      include: {
        _count: {
          select: { recetas: true },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async getIngredienteById(tenantId: string, id: string) {
    const ingrediente = await prisma.ingrediente.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        recetas: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!ingrediente) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    return ingrediente;
  }

  async updateIngrediente(tenantId: string, id: string, data: UpdateIngredienteDTO): Promise<Ingrediente> {
    if (data.nombre) {
      const existingIngrediente = await prisma.ingrediente.findFirst({
        where: {
          tenantId,
          nombre: data.nombre,
          id: { not: id },
        },
      });

      if (existingIngrediente) {
        throw new AppError('Ya existe un ingrediente con ese nombre', 400);
      }
    }

    const updated = await this.update(tenantId, id, data);

    // Si se actualizó el costo, recalcular costos de productos que usan este ingrediente
    if (data.costo !== undefined) {
      await this.actualizarCostosProductosRelacionados(id);
    }

    return updated;
  }

  async actualizarCostosProductosRelacionados(ingredienteId: string): Promise<void> {
    // Obtener todos los productos que usan este ingrediente en su receta
    const recetas = await prisma.receta.findMany({
      where: {
        ingredienteId,
      },
      select: {
        productoId: true,
      },
      distinct: ['productoId'],
    });

    // Importar dinámicamente para evitar dependencia circular
    const { RecetaService } = await import('./receta.service');
    const recetaService = new RecetaService();

    // Actualizar el costo de cada producto
    for (const receta of recetas) {
      try {
        await recetaService.updateCostoProducto(receta.productoId);
      } catch (error) {
        console.error(`Error al actualizar costo del producto ${receta.productoId}:`, error);
      }
    }
  }

  async deleteIngrediente(tenantId: string, id: string): Promise<void> {
    const recetasCount = await prisma.receta.count({
      where: {
        ingredienteId: id,
      },
    });

    if (recetasCount > 0) {
      throw new AppError(
        'No se puede eliminar el ingrediente porque está siendo usado en recetas',
        400
      );
    }

    await this.delete(tenantId, id);
  }

  async getIngredientesBajoStock(tenantId: string) {
    return await prisma.ingrediente.findMany({
      where: {
        tenantId,
        activo: true,
      },
      orderBy: {
        stockActual: 'asc',
      },
    });
  }

  async updateStock(tenantId: string, id: string, cantidad: number): Promise<Ingrediente> {
    const ingrediente = await this.getIngredienteById(tenantId, id);

    const nuevoStock = Number(ingrediente.stockActual) + cantidad;

    if (nuevoStock < 0) {
      throw new AppError('Stock insuficiente', 400);
    }

    return await this.update(tenantId, id, {
      stockActual: nuevoStock,
    });
  }
}
