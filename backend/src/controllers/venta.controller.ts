import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VentaService } from '../services/venta.service';

const itemVentaSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  precio: z.number().positive(),
  notas: z.string().optional(),
});

const pagoSchema = z.object({
  metodo: z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'QR', 'OTRO']),
  monto: z.number().positive(),
  referencia: z.string().optional(),
  notas: z.string().optional(),
});

const createVentaSchema = z.object({
  clienteId: z.string().uuid().optional(),
  mesaId: z.string().uuid().optional(),
  tipo: z.enum(['MOSTRADOR', 'MESA', 'DELIVERY', 'ONLINE']),
  compradorNombre: z.string().optional(),
  compradorTelefono: z.string().optional(),
  direccionEntrega: z.string().optional(),
  estadoPago: z.string().optional(),
  items: z.array(itemVentaSchema).min(1, 'Debe haber al menos un item'),
  subtotal: z.number().positive(),
  descuento: z.number().min(0).optional(),
  propina: z.number().min(0).optional(),
  total: z.number().positive(),
  pagos: z.array(pagoSchema),
});

export class VentaController {
  constructor(private ventaService: VentaService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const usuarioId = req.userId!;
      const validatedData = createVentaSchema.parse(req.body);
      
      const venta = await this.ventaService.createVenta(tenantId, usuarioId, validatedData);
      
      res.status(201).json(venta);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { estado, tipo, fechaDesde, fechaHasta } = req.query;

      const filters = {
        estado: estado as string,
        tipo: tipo as string,
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      };

      const ventas = await this.ventaService.getVentas(tenantId, filters);
      
      res.json(ventas);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const venta = await this.ventaService.getVentaById(tenantId, id);
      
      res.json(venta);
    } catch (error) {
      next(error);
    }
  }

  async cancelar(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const venta = await this.ventaService.cancelarVenta(tenantId, id);
      
      res.json(venta);
    } catch (error) {
      next(error);
    }
  }

  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { fechaDesde, fechaHasta } = req.query;

      const estadisticas = await this.ventaService.getEstadisticas(
        tenantId,
        fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta ? new Date(fechaHasta as string) : undefined
      );
      
      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }
}
