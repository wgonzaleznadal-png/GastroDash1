import { Request, Response } from 'express';
import { z } from 'zod';
import { recetaIngredienteService } from '../services/receta-ingrediente.service';

const createRecetaIngredienteSchema = z.object({
  ingredienteId: z.string().uuid(),
  ingredienteComponenteId: z.string().uuid(),
  cantidad: z.number().positive(),
  unidad: z.enum(['KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'PORCION', 'DOCENA', 'MAPLE']),
});

export class RecetaIngredienteController {
  async addComponente(req: Request, res: Response) {
    try {
      const data = createRecetaIngredienteSchema.parse(req.body);
      const receta = await recetaIngredienteService.addComponenteToIngrediente(
        (req as any).tenantId,
        data
      );
      res.status(201).json(receta);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      throw error;
    }
  }

  async getRecetasByIngrediente(req: Request, res: Response) {
    const { ingredienteId } = req.params;
    const recetas = await recetaIngredienteService.getRecetasByIngrediente(ingredienteId);
    res.json(recetas);
  }

  async deleteReceta(req: Request, res: Response) {
    const { id } = req.params;
    await recetaIngredienteService.deleteReceta(id);
    res.status(204).send();
  }

  async calcularCosto(req: Request, res: Response) {
    const { ingredienteId } = req.params;
    const resultado = await recetaIngredienteService.calcularCostoReceta(ingredienteId);
    res.json(resultado);
  }
}

export const recetaIngredienteController = new RecetaIngredienteController();
