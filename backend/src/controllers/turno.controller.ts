import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TurnoService } from '../services/turno.service';

const abrirTurnoSchema = z.object({
  montoInicial: z.number().min(0),
});

const cerrarTurnoSchema = z.object({
  montoFinal: z.number().min(0),
  notas: z.string().optional(),
});

export class TurnoController {
  constructor(private turnoService: TurnoService) {}

  async abrirTurno(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const usuarioId = req.userId!;
      const validatedData = abrirTurnoSchema.parse(req.body);
      
      const turno = await this.turnoService.abrirTurno(tenantId, usuarioId, validatedData);
      
      res.status(201).json(turno);
    } catch (error) {
      next(error);
    }
  }

  async getTurnoActivo(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const usuarioId = req.userId!;
      
      const turno = await this.turnoService.getTurnoActivo(tenantId, usuarioId);
      
      if (!turno) {
        return res.status(404).json({ message: 'No hay turno activo' });
      }
      
      res.json(turno);
    } catch (error) {
      next(error);
    }
  }

  async cerrarTurno(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const validatedData = cerrarTurnoSchema.parse(req.body);
      
      const turno = await this.turnoService.cerrarTurno(tenantId, id, validatedData);
      
      res.json(turno);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { usuarioId, estado, fechaDesde, fechaHasta } = req.query;

      const filters = {
        usuarioId: usuarioId as string,
        estado: estado as any,
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      };

      const turnos = await this.turnoService.getTurnos(tenantId, filters);
      
      res.json(turnos);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const turno = await this.turnoService.getTurnoById(tenantId, id);
      
      res.json(turno);
    } catch (error) {
      next(error);
    }
  }

  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const estadisticas = await this.turnoService.getEstadisticasTurno(tenantId, id);
      
      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }
}
