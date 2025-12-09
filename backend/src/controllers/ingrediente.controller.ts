import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IngredienteService } from '../services/ingrediente.service';

const createIngredienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  costo: z.number().min(0, 'El costo debe ser mayor o igual a 0').optional().default(0),
  unidad: z.enum(['KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'PORCION', 'DOCENA', 'MAPLE']).optional().default('KILOGRAMO'),
  esCompuesto: z.boolean().optional().default(false),
  stockActual: z.number().min(0).optional().default(0),
  stockMinimo: z.number().min(0).optional().default(0),
  activo: z.boolean().optional().default(true),
});

const updateIngredienteSchema = createIngredienteSchema.partial();

const updateStockSchema = z.object({
  cantidad: z.number(),
});

export class IngredienteController {
  constructor(private ingredienteService: IngredienteService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validatedData = createIngredienteSchema.parse(req.body);
      
      const ingrediente = await this.ingredienteService.createIngrediente(tenantId, validatedData);
      
      res.status(201).json(ingrediente);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { activo, search } = req.query;

      const filters = {
        activo: activo === 'true' ? true : activo === 'false' ? false : undefined,
        search: search as string,
      };

      const ingredientes = await this.ingredienteService.getIngredientes(tenantId, filters);
      
      res.json(ingredientes);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const ingrediente = await this.ingredienteService.getIngredienteById(tenantId, id);
      
      res.json(ingrediente);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const validatedData = updateIngredienteSchema.parse(req.body);

      const ingrediente = await this.ingredienteService.updateIngrediente(tenantId, id, validatedData);
      
      res.json(ingrediente);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await this.ingredienteService.deleteIngrediente(tenantId, id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { cantidad } = updateStockSchema.parse(req.body);

      const ingrediente = await this.ingredienteService.updateStock(tenantId, id, cantidad);
      
      res.json(ingrediente);
    } catch (error) {
      next(error);
    }
  }

  async getBajoStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const ingredientes = await this.ingredienteService.getIngredientesBajoStock(tenantId);
      
      res.json(ingredientes);
    } catch (error) {
      next(error);
    }
  }
}
