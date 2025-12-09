import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProveedorService } from '../services/proveedor.service';

const createProveedorSchema = z.object({
  nombre: z.string().min(1),
  razonSocial: z.string().optional(),
  cuit: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
  contacto: z.string().optional(),
});

const updateProveedorSchema = createProveedorSchema.partial();

export class ProveedorController {
  private proveedorService: ProveedorService;

  constructor() {
    this.proveedorService = new ProveedorService();
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const data = createProveedorSchema.parse(req.body);

      const proveedor = await this.proveedorService.createProveedor(tenantId, data);
      
      res.status(201).json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { activo, search } = req.query;

      const proveedores = await this.proveedorService.getProveedores(tenantId, {
        activo: activo === 'true' ? true : activo === 'false' ? false : undefined,
        search: search as string,
      });
      
      res.json(proveedores);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const proveedor = await this.proveedorService.getProveedorById(tenantId, id);
      
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const data = updateProveedorSchema.parse(req.body);

      const proveedor = await this.proveedorService.updateProveedor(tenantId, id, data);
      
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const proveedor = await this.proveedorService.deleteProveedor(tenantId, id);
      
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }
}
