import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { MesaService } from '../services/mesa.service';

const createMesaSchema = z.object({
  numero: z.number().int().positive(),
  capacidad: z.number().int().positive(),
  sala: z.string().optional(),
});

export class MesaController {
  constructor(private mesaService: MesaService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const mesas = await this.mesaService.getMesas(tenantId);
      res.json(mesas);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const mesa = await this.mesaService.getMesaById(tenantId, id);
      res.json(mesa);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validatedData = createMesaSchema.parse(req.body);
      const mesa = await this.mesaService.createMesa(tenantId, validatedData);
      res.status(201).json(mesa);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const mesa = await this.mesaService.updateMesa(tenantId, id, req.body);
      res.json(mesa);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await this.mesaService.deleteMesa(tenantId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
