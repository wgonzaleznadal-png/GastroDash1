import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export class ProductoIntermedioService {
  
  /**
   * Crear o actualizar ingrediente vinculado a un producto intermedio
   */
  async crearIngredienteVinculado(
    tenantId: string,
    productoId: string
  ) {
    // Obtener producto con sus recetas
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      include: { 
        recetas: { 
          include: { ingrediente: true } 
        } 
      }
    });

    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    if (!producto.esProductoIntermedio) {
      throw new AppError('El producto no está marcado como producto intermedio', 400);
    }

    if (!producto.rendimiento || !producto.unidadRendimiento) {
      throw new AppError('El producto intermedio debe tener rendimiento y unidad definidos', 400);
    }

    // Calcular costo por unidad
    const costoTotal = Number(producto.costo) || 0;
    const rendimiento = Number(producto.rendimiento);
    const costoPorUnidad = rendimiento > 0 ? costoTotal / rendimiento : 0;

    // Buscar si ya existe un ingrediente vinculado
    const ingredienteExistente = await prisma.ingrediente.findUnique({
      where: { productoVinculadoId: productoId }
    });

    if (ingredienteExistente) {
      // Actualizar ingrediente existente
      return await prisma.ingrediente.update({
        where: { id: ingredienteExistente.id },
        data: {
          costo: costoPorUnidad,
          unidad: producto.unidadRendimiento as any,
          nombre: producto.nombre,
          descripcion: `Auto-generado desde producto intermedio (${producto.nombre})`
        }
      });
    } else {
      // Crear nuevo ingrediente
      return await prisma.ingrediente.create({
        data: {
          tenantId,
          nombre: producto.nombre,
          descripcion: `Auto-generado desde producto intermedio`,
          costo: costoPorUnidad,
          unidad: producto.unidadRendimiento as any,
          productoVinculadoId: productoId,
          stockActual: 0,
          stockMinimo: 0,
          activo: true
        }
      });
    }
  }

  /**
   * Actualizar costo del ingrediente vinculado cuando cambia el producto
   */
  async actualizarCostoIngredienteVinculado(productoId: string) {
    // Buscar ingrediente vinculado
    const ingrediente = await prisma.ingrediente.findUnique({
      where: { productoVinculadoId: productoId },
      include: { productoVinculado: true }
    });

    if (!ingrediente || !ingrediente.productoVinculado) {
      return; // No hay ingrediente vinculado, no hacer nada
    }

    const producto = ingrediente.productoVinculado;
    const costoTotal = Number(producto.costo) || 0;
    const rendimiento = Number(producto.rendimiento) || 1;
    const costoPorUnidad = costoTotal / rendimiento;

    // Actualizar costo del ingrediente
    await prisma.ingrediente.update({
      where: { id: ingrediente.id },
      data: { 
        costo: costoPorUnidad,
        nombre: producto.nombre,
        unidad: producto.unidadRendimiento as any
      }
    });

    // Recalcular productos que usan este ingrediente
    await this.recalcularProductosQueUsanIngrediente(ingrediente.id);
  }

  /**
   * Recalcular costo de productos que usan un ingrediente específico
   */
  async recalcularProductosQueUsanIngrediente(ingredienteId: string) {
    // Obtener todas las recetas que usan este ingrediente
    const recetas = await prisma.receta.findMany({
      where: { ingredienteId },
      include: { 
        producto: true,
        ingrediente: true
      }
    });

    // Recalcular costo de cada producto
    for (const receta of recetas) {
      await this.recalcularCostoProducto(receta.productoId);
    }
  }

  /**
   * Recalcular costo total de un producto basado en sus recetas
   */
  async recalcularCostoProducto(productoId: string) {
    const recetas = await prisma.receta.findMany({
      where: { productoId },
      include: { ingrediente: true }
    });

    let costoTotal = 0;

    for (const receta of recetas) {
      const costoIngrediente = Number(receta.ingrediente.costo);
      const cantidad = Number(receta.cantidad);
      let costoReceta = costoIngrediente * cantidad;

      // Conversión de unidades
      if (receta.unidad === 'GRAMO' && receta.ingrediente.unidad === 'KILOGRAMO') {
        costoReceta = (costoIngrediente * cantidad) / 1000;
      } else if (receta.unidad === 'MILILITRO' && receta.ingrediente.unidad === 'LITRO') {
        costoReceta = (costoIngrediente * cantidad) / 1000;
      } else if (receta.unidad === 'KILOGRAMO' && receta.ingrediente.unidad === 'GRAMO') {
        costoReceta = (costoIngrediente * cantidad) * 1000;
      } else if (receta.unidad === 'LITRO' && receta.ingrediente.unidad === 'MILILITRO') {
        costoReceta = (costoIngrediente * cantidad) * 1000;
      }

      costoTotal += costoReceta;
    }

    // Actualizar costo del producto
    await prisma.producto.update({
      where: { id: productoId },
      data: { costo: costoTotal }
    });

    // Si este producto también es intermedio, actualizar su ingrediente vinculado
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    });

    if (producto?.esProductoIntermedio) {
      await this.actualizarCostoIngredienteVinculado(productoId);
    }

    return costoTotal;
  }

  /**
   * Eliminar ingrediente vinculado cuando un producto deja de ser intermedio
   */
  async eliminarIngredienteVinculado(productoId: string) {
    const ingrediente = await prisma.ingrediente.findUnique({
      where: { productoVinculadoId: productoId }
    });

    if (ingrediente) {
      // Verificar si el ingrediente está siendo usado en alguna receta
      const recetasUsando = await prisma.receta.count({
        where: { ingredienteId: ingrediente.id }
      });

      if (recetasUsando > 0) {
        throw new AppError(
          `No se puede eliminar el ingrediente vinculado porque está siendo usado en ${recetasUsando} receta(s)`,
          400
        );
      }

      await prisma.ingrediente.delete({
        where: { id: ingrediente.id }
      });
    }
  }
}

export const productoIntermedioService = new ProductoIntermedioService();
