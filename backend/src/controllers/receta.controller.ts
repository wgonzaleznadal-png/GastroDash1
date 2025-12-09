import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RecetaService } from '../services/receta.service';

const createRecetaSchema = z.object({
  productoId: z.string().uuid(),
  ingredienteId: z.string().uuid(),
  cantidad: z.number().positive(),
  unidad: z.enum(['KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'PORCION', 'DOCENA', 'MAPLE']),
});

const updateRecetaSchema = z.object({
  cantidad: z.number().positive().optional(),
  unidad: z.enum(['KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'PORCION', 'DOCENA', 'MAPLE']).optional(),
});

export class RecetaController {
  constructor(private recetaService: RecetaService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validatedData = createRecetaSchema.parse(req.body);
      
      const receta = await this.recetaService.addIngredienteToProducto(tenantId, validatedData);
      
      // Actualizar costo del producto
      await this.recetaService.updateCostoProducto(validatedData.productoId);
      
      res.status(201).json(receta);
    } catch (error) {
      next(error);
    }
  }

  async getByProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const { productoId } = req.params;

      const recetas = await this.recetaService.getRecetasByProducto(productoId);
      
      res.json(recetas);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateRecetaSchema.parse(req.body);

      const receta = await this.recetaService.updateReceta(id, validatedData);
      
      // Actualizar costo del producto
      await this.recetaService.updateCostoProducto(receta.productoId);
      
      res.json(receta);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Obtener la receta antes de eliminarla para saber el productoId
      const receta = await this.recetaService.getRecetasByProducto('');
      const recetaToDelete = receta.find(r => r.id === id);
      
      await this.recetaService.deleteReceta(id);
      
      // Actualizar costo del producto si encontramos la receta
      if (recetaToDelete) {
        await this.recetaService.updateCostoProducto(recetaToDelete.productoId);
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async calcularCosto(req: Request, res: Response, next: NextFunction) {
    try {
      const { productoId } = req.params;

      const costo = await this.recetaService.calcularCostoReceta(productoId);
      
      res.json({ costo });
    } catch (error) {
      next(error);
    }
  }
}
