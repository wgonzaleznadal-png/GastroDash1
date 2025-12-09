import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CategoriaService } from '../services/categoria.service';

const createCategoriaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  orden: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

const updateCategoriaSchema = createCategoriaSchema.partial();

export class CategoriaController {
  constructor(private categoriaService: CategoriaService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validatedData = createCategoriaSchema.parse(req.body);
      
      const categoria = await this.categoriaService.createCategoria(tenantId, validatedData);
      
      res.status(201).json(categoria);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { activo } = req.query;

      const categorias = await this.categoriaService.getCategorias(
        tenantId,
        activo === 'true' ? true : activo === 'false' ? false : undefined
      );
      
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const validatedData = updateCategoriaSchema.parse(req.body);

      const categoria = await this.categoriaService.updateCategoria(tenantId, id, validatedData);
      
      res.json(categoria);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await this.categoriaService.deleteCategoria(tenantId, id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
