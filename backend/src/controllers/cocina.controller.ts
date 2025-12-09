import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CocinaService } from '../services/cocina.service';

const createOrdenSchema = z.object({
  ventaId: z.string().uuid(),
  estacionId: z.string().uuid().optional(),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  tiempoEstimado: z.number().int().positive().optional(),
  notas: z.string().optional(),
});

const updateEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO']),
  notas: z.string().optional(),
});

const updatePrioridadSchema = z.object({
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']),
});

const createEstacionSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  orden: z.number().int().optional(),
});

const updateEstacionSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export class CocinaController {
  private cocinaService: CocinaService;

  constructor() {
    this.cocinaService = new CocinaService();
  }

  // Órdenes de Cocina
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const usuarioId = req.userId!;
      const data = createOrdenSchema.parse(req.body);

      const orden = await this.cocinaService.createOrdenCocina(tenantId, usuarioId, data);
      
      res.status(201).json(orden);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { estado, estacionId, prioridad } = req.query;

      const ordenes = await this.cocinaService.getOrdenes(tenantId, {
        estado: estado as any,
        estacionId: estacionId as string,
        prioridad: prioridad as any,
      });
      
      res.json(ordenes);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const orden = await this.cocinaService.getOrdenById(tenantId, id);
      
      res.json(orden);
    } catch (error) {
      next(error);
    }
  }

  async updateEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const data = updateEstadoSchema.parse(req.body);

      const orden = await this.cocinaService.updateEstado(tenantId, id, data);
      
      res.json(orden);
    } catch (error) {
      next(error);
    }
  }

  async updatePrioridad(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { prioridad } = updatePrioridadSchema.parse(req.body);

      const orden = await this.cocinaService.updatePrioridad(tenantId, id, prioridad);
      
      res.json(orden);
    } catch (error) {
      next(error);
    }
  }

  async marcarImpreso(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const orden = await this.cocinaService.marcarImpreso(tenantId, id);
      
      res.json(orden);
    } catch (error) {
      next(error);
    }
  }

  async marcarNotificado(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const orden = await this.cocinaService.marcarNotificado(tenantId, id);
      
      res.json(orden);
    } catch (error) {
      next(error);
    }
  }

  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { fechaDesde, fechaHasta } = req.query;

      const estadisticas = await this.cocinaService.getEstadisticas(
        tenantId,
        fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta ? new Date(fechaHasta as string) : undefined
      );
      
      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }

  // Estaciones de Cocina
  async createEstacion(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const usuarioId = req.userId!;
      const data = createEstacionSchema.parse(req.body);

      const estacion = await this.cocinaService.createEstacion(tenantId, usuarioId, data);
      
      res.status(201).json(estacion);
    } catch (error) {
      next(error);
    }
  }

  async getEstaciones(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const estaciones = await this.cocinaService.getEstaciones(tenantId);
      
      res.json(estaciones);
    } catch (error) {
      next(error);
    }
  }

  async updateEstacion(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const data = updateEstacionSchema.parse(req.body);

      const estacion = await this.cocinaService.updateEstacion(tenantId, id, data);
      
      res.json(estacion);
    } catch (error) {
      next(error);
    }
  }

  async deleteEstacion(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const estacion = await this.cocinaService.deleteEstacion(tenantId, id);
      
      res.json(estacion);
    } catch (error) {
      next(error);
    }
  }
}
