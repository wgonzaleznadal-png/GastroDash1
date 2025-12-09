import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CompraService } from '../services/compra.service';

const itemCompraSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  categoria: z.enum(['ALIMENTOS', 'BEBIDAS', 'LIMPIEZA', 'DESCARTABLES', 'ARTICULOS_COCINA', 'VARIOS']),
  unidad: z.enum(['KG', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'DOCENA', 'CAJA', 'BANDEJA', 'PAQUETE', 'BOLSA', 'LATA', 'BOTELLA', 'SOBRE', 'MAPLE']),
  cantidadComprada: z.number().positive(),
  precioUnitario: z.number().positive(),
  precioTotal: z.number().positive(),
  marca: z.string().optional(),
  observaciones: z.string().optional(),
});

const createCompraSchema = z.object({
  proveedorId: z.string().uuid().optional(), // Ahora es opcional
  numeroFactura: z.string().optional(),
  fechaCompra: z.string().optional(), // Acepta cualquier string de fecha
  fechaEntrega: z.string().optional(), // Acepta cualquier string de fecha
  subtotal: z.number().positive(),
  impuestos: z.number().optional(),
  descuentos: z.number().optional(),
  total: z.number().positive(),
  observaciones: z.string().optional(),
  items: z.array(itemCompraSchema).min(1),
});

const receiveCompraSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().uuid(),
    cantidadRecibida: z.number().positive(),
  })).min(1),
});

const updateCompraSchema = z.object({
  numeroFactura: z.string().optional(),
  fechaCompra: z.string().optional(),
  fechaEntrega: z.string().optional(),
  observaciones: z.string().optional(),
});

export class CompraController {
  private compraService: CompraService;

  constructor() {
    this.compraService = new CompraService();
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const usuarioId = req.userId!;
      const data = createCompraSchema.parse(req.body);

      const compra = await this.compraService.createCompra(tenantId, usuarioId, {
        ...data,
        fechaCompra: data.fechaCompra ? new Date(data.fechaCompra) : undefined,
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : undefined,
      } as any);
      
      res.status(201).json(compra);
    } catch (error) {
      next(error);
    }
  }

  async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const data = receiveCompraSchema.parse(req.body);

      const compra = await this.compraService.receiveCompra(tenantId, id, data);
      
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { estado, proveedorId, fechaDesde, fechaHasta } = req.query;

      const compras = await this.compraService.getCompras(tenantId, {
        estado: estado as string,
        proveedorId: proveedorId as string,
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
      });
      
      res.json(compras);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const compra = await this.compraService.getCompraById(tenantId, id);
      
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const data = updateCompraSchema.parse(req.body);

      const compra = await this.compraService.updateCompra(tenantId, id, {
        ...data,
        fechaCompra: data.fechaCompra ? new Date(data.fechaCompra) : undefined,
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : undefined,
      });
      
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const compra = await this.compraService.cancelCompra(tenantId, id);
      
      res.json(compra);
    } catch (error) {
      next(error);
    }
  }

  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { fechaDesde, fechaHasta } = req.query;

      const estadisticas = await this.compraService.getEstadisticas(
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
