import { PrismaClient, Categoria } from '@prisma/client';
import { BaseRepository } from '../repositories/base.repository';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateCategoriaDTO {
  nombre: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
}

interface UpdateCategoriaDTO extends Partial<CreateCategoriaDTO> {}

export class CategoriaService extends BaseRepository<Categoria> {
  constructor() {
    super(prisma, 'categoria');
  }

  async createCategoria(tenantId: string, data: CreateCategoriaDTO): Promise<Categoria> {
    const existingCategoria = await prisma.categoria.findFirst({
      where: {
        tenantId,
        nombre: data.nombre,
      },
    });

    if (existingCategoria) {
      throw new AppError('Ya existe una categoría con ese nombre', 400);
    }

    return await this.create(tenantId, {
      ...data,
      activo: data.activo ?? true,
      orden: data.orden ?? 0,
    });
  }

  async getCategorias(tenantId: string, activo?: boolean) {
    const where: any = { tenantId };
    
    if (activo !== undefined) {
      where.activo = activo;
    }

    return await prisma.categoria.findMany({
      where,
      include: {
        _count: {
          select: { productos: true },
        },
      },
      orderBy: {
        orden: 'asc',
      },
    });
  }

  async updateCategoria(tenantId: string, id: string, data: UpdateCategoriaDTO): Promise<Categoria> {
    if (data.nombre) {
      const existingCategoria = await prisma.categoria.findFirst({
        where: {
          tenantId,
          nombre: data.nombre,
          id: { not: id },
        },
      });

      if (existingCategoria) {
        throw new AppError('Ya existe una categoría con ese nombre', 400);
      }
    }

    return await this.update(tenantId, id, data);
  }

  async deleteCategoria(tenantId: string, id: string): Promise<void> {
    const productosCount = await prisma.producto.count({
      where: {
        categoriaId: id,
        tenantId,
      },
    });

    if (productosCount > 0) {
      throw new AppError(
        'No se puede eliminar la categoría porque tiene productos asociados',
        400
      );
    }

    await this.delete(tenantId, id);
  }
}
