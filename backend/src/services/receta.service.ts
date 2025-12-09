import { PrismaClient, Receta, UnidadMedida } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { productoIntermedioService } from './producto-intermedio.service';

const prisma = new PrismaClient();

interface CreateRecetaDTO {
  productoId: string;
  ingredienteId: string;
  cantidad: number;
  unidad: UnidadMedida;
}

interface UpdateRecetaDTO {
  cantidad?: number;
  unidad?: UnidadMedida;
}

export class RecetaService {
  async addIngredienteToProducto(tenantId: string, data: CreateRecetaDTO): Promise<Receta> {
    // Verificar que el producto existe y pertenece al tenant
    const producto = await prisma.producto.findFirst({
      where: {
        id: data.productoId,
        tenantId,
      },
    });

    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    // Verificar que el ingrediente existe y pertenece al tenant
    const ingrediente = await prisma.ingrediente.findFirst({
      where: {
        id: data.ingredienteId,
        tenantId,
      },
    });

    if (!ingrediente) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    // Verificar si ya existe esta combinación
    const existingReceta = await prisma.receta.findFirst({
      where: {
        productoId: data.productoId,
        ingredienteId: data.ingredienteId,
      },
    });

    if (existingReceta) {
      throw new AppError('Este ingrediente ya está en la receta', 400);
    }

    const receta = await prisma.receta.create({
      data: {
        productoId: data.productoId,
        ingredienteId: data.ingredienteId,
        cantidad: data.cantidad,
        unidad: data.unidad,
      },
      include: {
        ingrediente: true,
      },
    });

    // Actualizar automáticamente el costo del producto
    await this.updateCostoProducto(data.productoId);

    return receta;
  }

  async getRecetasByProducto(productoId: string) {
    return await prisma.receta.findMany({
      where: {
        productoId,
      },
      include: {
        ingrediente: true,
      },
      orderBy: {
        ingrediente: {
          nombre: 'asc',
        },
      },
    });
  }

  async updateReceta(id: string, data: UpdateRecetaDTO): Promise<Receta> {
    const receta = await prisma.receta.findUnique({
      where: { id },
      select: { productoId: true },
    });

    const updated = await prisma.receta.update({
      where: { id },
      data,
      include: {
        ingrediente: true,
      },
    });

    // Actualizar automáticamente el costo del producto
    if (receta) {
      await this.updateCostoProducto(receta.productoId);
    }

    return updated;
  }

  async deleteReceta(id: string): Promise<void> {
    const receta = await prisma.receta.findUnique({
      where: { id },
      select: { productoId: true },
    });

    await prisma.receta.delete({
      where: { id },
    });

    // Actualizar automáticamente el costo del producto
    if (receta) {
      await this.updateCostoProducto(receta.productoId);
    }
  }

  async calcularCostoReceta(productoId: string): Promise<number> {
    const recetas = await this.getRecetasByProducto(productoId);

    let costoTotal = 0;

    for (const receta of recetas) {
      const costoIngrediente = Number(receta.ingrediente.costo);
      const cantidad = Number(receta.cantidad);

      // Convertir a la misma unidad si es necesario
      let cantidadConvertida = cantidad;

      // Conversión automática: DOCENA → UNIDAD (divide por 12)
      if (receta.unidad === 'UNIDAD' && receta.ingrediente.unidad === 'DOCENA') {
        const costoPorUnidad = costoIngrediente / 12;
        costoTotal += costoPorUnidad * cantidad;
        continue;
      }

      // Conversión automática: MAPLE → UNIDAD (divide por 30)
      if (receta.unidad === 'UNIDAD' && receta.ingrediente.unidad === 'MAPLE') {
        const costoPorUnidad = costoIngrediente / 30;
        costoTotal += costoPorUnidad * cantidad;
        continue;
      }

      // Convertir gramos a kilogramos si el ingrediente está en kg
      if (receta.unidad === 'GRAMO' && receta.ingrediente.unidad === 'KILOGRAMO') {
        cantidadConvertida = cantidad / 1000;
      }
      // Convertir kilogramos a gramos si el ingrediente está en g
      else if (receta.unidad === 'KILOGRAMO' && receta.ingrediente.unidad === 'GRAMO') {
        cantidadConvertida = cantidad * 1000;
      }
      // Convertir mililitros a litros
      else if (receta.unidad === 'MILILITRO' && receta.ingrediente.unidad === 'LITRO') {
        cantidadConvertida = cantidad / 1000;
      }
      // Convertir litros a mililitros
      else if (receta.unidad === 'LITRO' && receta.ingrediente.unidad === 'MILILITRO') {
        cantidadConvertida = cantidad * 1000;
      }

      costoTotal += costoIngrediente * cantidadConvertida;
    }

    return Math.round(costoTotal);
  }

  async updateCostoProducto(productoId: string): Promise<void> {
    const costoCalculado = await this.calcularCostoReceta(productoId);

    await prisma.producto.update({
      where: { id: productoId },
      data: { costo: costoCalculado },
    });

    // Si el producto es intermedio, actualizar ingrediente vinculado
    try {
      await productoIntermedioService.actualizarCostoIngredienteVinculado(productoId);
    } catch (error) {
      console.error('Error al actualizar ingrediente vinculado:', error);
    }
  }
}
