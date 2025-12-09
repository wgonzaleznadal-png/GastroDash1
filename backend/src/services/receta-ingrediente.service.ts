import { PrismaClient, RecetaIngrediente, UnidadMedida } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CreateRecetaIngredienteDTO {
  ingredienteId: string;
  ingredienteComponenteId: string;
  cantidad: number;
  unidad: UnidadMedida;
}

export class RecetaIngredienteService {
  
  async addComponenteToIngrediente(tenantId: string, data: CreateRecetaIngredienteDTO): Promise<RecetaIngrediente> {
    // Verificar que el ingrediente principal existe
    const ingrediente = await prisma.ingrediente.findFirst({
      where: {
        id: data.ingredienteId,
        tenantId,
      },
    });

    if (!ingrediente) {
      throw new AppError('Ingrediente no encontrado', 404);
    }

    // Verificar que el componente existe
    const componente = await prisma.ingrediente.findFirst({
      where: {
        id: data.ingredienteComponenteId,
        tenantId,
      },
    });

    if (!componente) {
      throw new AppError('Ingrediente componente no encontrado', 404);
    }

    // Verificar que no se esté agregando a sí mismo
    if (data.ingredienteId === data.ingredienteComponenteId) {
      throw new AppError('Un ingrediente no puede ser componente de sí mismo', 400);
    }

    // Verificar si ya existe
    const existente = await prisma.recetaIngrediente.findFirst({
      where: {
        ingredienteId: data.ingredienteId,
        ingredienteComponenteId: data.ingredienteComponenteId,
      },
    });

    if (existente) {
      throw new AppError('Este componente ya está en la receta', 400);
    }

    // Crear la receta
    const receta = await prisma.recetaIngrediente.create({
      data: {
        ingredienteId: data.ingredienteId,
        ingredienteComponenteId: data.ingredienteComponenteId,
        cantidad: data.cantidad,
        unidad: data.unidad,
      },
      include: {
        ingredienteComponente: true,
      },
    });

    // Recalcular costo del ingrediente
    await this.recalcularCostoIngrediente(data.ingredienteId);

    return receta;
  }

  async getRecetasByIngrediente(ingredienteId: string) {
    return await prisma.recetaIngrediente.findMany({
      where: { ingredienteId },
      include: {
        ingredienteComponente: true,
      },
      orderBy: {
        ingredienteComponente: {
          nombre: 'asc',
        },
      },
    });
  }

  async deleteReceta(id: string): Promise<void> {
    const receta = await prisma.recetaIngrediente.findUnique({
      where: { id },
    });

    if (!receta) {
      throw new AppError('Receta no encontrada', 404);
    }

    await prisma.recetaIngrediente.delete({
      where: { id },
    });

    // Recalcular costo del ingrediente
    await this.recalcularCostoIngrediente(receta.ingredienteId);
  }

  async recalcularCostoIngrediente(ingredienteId: string): Promise<number> {
    const recetas = await this.getRecetasByIngrediente(ingredienteId);

    let costoTotal = 0;

    for (const receta of recetas) {
      const costoComponente = Number(receta.ingredienteComponente.costo);
      const cantidad = Number(receta.cantidad);

      // Convertir unidades si es necesario
      let costoCalculado = costoComponente * cantidad;

      // Conversión DOCENA → UNIDAD
      if (receta.unidad === 'UNIDAD' && receta.ingredienteComponente.unidad === 'DOCENA') {
        costoCalculado = (costoComponente / 12) * cantidad;
      }
      // Conversión MAPLE → UNIDAD
      else if (receta.unidad === 'UNIDAD' && receta.ingredienteComponente.unidad === 'MAPLE') {
        costoCalculado = (costoComponente / 30) * cantidad;
      }
      // Conversión GRAMO ↔ KILOGRAMO
      else if (receta.unidad === 'GRAMO' && receta.ingredienteComponente.unidad === 'KILOGRAMO') {
        costoCalculado = (costoComponente / 1000) * cantidad;
      } else if (receta.unidad === 'KILOGRAMO' && receta.ingredienteComponente.unidad === 'GRAMO') {
        costoCalculado = (costoComponente * 1000) * cantidad;
      }
      // Conversión MILILITRO ↔ LITRO
      else if (receta.unidad === 'MILILITRO' && receta.ingredienteComponente.unidad === 'LITRO') {
        costoCalculado = (costoComponente / 1000) * cantidad;
      } else if (receta.unidad === 'LITRO' && receta.ingredienteComponente.unidad === 'MILILITRO') {
        costoCalculado = (costoComponente * 1000) * cantidad;
      }

      costoTotal += costoCalculado;
    }

    // Actualizar costo del ingrediente
    await prisma.ingrediente.update({
      where: { id: ingredienteId },
      data: { costo: Math.round(costoTotal) },
    });

    return Math.round(costoTotal);
  }

  async calcularCostoReceta(ingredienteId: string): Promise<{ costo: number }> {
    const costo = await this.recalcularCostoIngrediente(ingredienteId);
    return { costo };
  }
}

export const recetaIngredienteService = new RecetaIngredienteService();
