import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InventarioService } from '../services/inventario.service';
import { TipoMovimiento, MotivoMovimiento } from '@prisma/client';

const movimientoSchema = z.object({
  productoId: z.string().uuid(),
  tipo: z.nativeEnum(TipoMovimiento),
  motivo: z.nativeEnum(MotivoMovimiento),
  cantidad: z.number().positive(),
  costoUnitario: z.number().positive().optional(),
  ventaId: z.string().uuid().optional(),
  compraId: z.string().uuid().optional(),
  notas: z.string().optional(),
  lote: z.string().optional(),
  fechaVencimiento: z.string().datetime().optional(),
});

const ajusteInventarioSchema = z.object({
  motivo: z.string().min(3),
  observaciones: z.string().optional(),
  detalles: z.array(
    z.object({
      productoId: z.string().uuid(),
      stockFisico: z.number().min(0),
      motivo: z.string().optional(),
    })
  ).min(1),
});

export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  // ============================================
  // MOVIMIENTOS DE STOCK
  // ============================================

  async registrarMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const usuarioId = (req as any).userId;
      const validatedData = movimientoSchema.parse(req.body);

      const movimiento = await this.inventarioService.registrarMovimiento(
        tenantId,
        usuarioId,
        {
          ...validatedData,
          fechaVencimiento: validatedData.fechaVencimiento
            ? new Date(validatedData.fechaVencimiento)
            : undefined,
        }
      );

      res.status(201).json(movimiento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Datos de validación inválidos',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  async getMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { productoId, fechaDesde, fechaHasta } = req.query;

      const movimientos = await this.inventarioService.getMovimientos(
        tenantId,
        productoId as string,
        fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta ? new Date(fechaHasta as string) : undefined
      );

      res.json(movimientos);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // AJUSTES DE INVENTARIO
  // ============================================

  async crearAjuste(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const usuarioId = (req as any).userId;
      const validatedData = ajusteInventarioSchema.parse(req.body);

      const ajuste = await this.inventarioService.crearAjusteInventario(
        tenantId,
        usuarioId,
        validatedData
      );

      res.status(201).json(ajuste);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Datos de validación inválidos',
          details: error.errors,
        });
      }
      next(error);
    }
  }

  async getAjustes(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { estado } = req.query;

      const ajustes = await this.inventarioService.getAjustesInventario(
        tenantId,
        estado as string
      );

      res.json(ajustes);
    } catch (error) {
      next(error);
    }
  }

  async aprobarAjuste(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const usuarioId = (req as any).userId;
      const { id } = req.params;

      const ajuste = await this.inventarioService.aprobarAjusteInventario(
        tenantId,
        id,
        usuarioId
      );

      res.json(ajuste);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // ALERTAS
  // ============================================

  async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { leida } = req.query;

      const alertas = await this.inventarioService.getAlertas(
        tenantId,
        leida === 'true' ? true : leida === 'false' ? false : undefined
      );

      res.json(alertas);
    } catch (error) {
      next(error);
    }
  }

  async marcarAlertaLeida(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { id } = req.params;

      const alerta = await this.inventarioService.marcarAlertaLeida(tenantId, id);

      res.json(alerta);
    } catch (error) {
      next(error);
    }
  }

  async marcarTodasLeidas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;

      await this.inventarioService.marcarTodasAlertasLeidas(tenantId);

      res.json({ message: 'Todas las alertas marcadas como leídas' });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // REPORTES
  // ============================================

  async getReporte(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { categoriaId, stockBajo } = req.query;

      const reporte = await this.inventarioService.getReporteInventario(tenantId, {
        categoriaId: categoriaId as string,
        stockBajo: stockBajo === 'true',
      });

      res.json(reporte);
    } catch (error) {
      next(error);
    }
  }

  async getHistorialProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { productoId } = req.params;
      const { fechaDesde, fechaHasta } = req.query;

      const historial = await this.inventarioService.getHistorialProducto(
        tenantId,
        productoId,
        fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta ? new Date(fechaHasta as string) : undefined
      );

      res.json(historial);
    } catch (error) {
      next(error);
    }
  }
}
