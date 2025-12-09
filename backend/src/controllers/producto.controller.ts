import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductoService } from '../services/producto.service';

const createProductoSchema = z.object({
  categoriaId: z.string().uuid('ID de categoría inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  precio: z.number().min(0, 'El precio no puede ser negativo'),
  costo: z.number().min(0, 'El costo no puede ser negativo').optional().default(0),
  porcentajeImpuestos: z.number().min(0).max(100).optional().default(0),
  porcentajeBeneficio: z.number().min(0).max(100).optional().default(0),
  porcentajeOtros: z.number().min(0).max(100).optional().default(0),
  calcularPrecioAutomatico: z.boolean().optional().default(false),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  stockMinimo: z.number().int().min(0, 'El stock mínimo no puede ser negativo').default(0),
  codigoBarras: z.string().optional(),
  imagen: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  disponible: z.boolean().optional().default(true),
  // Producto Intermedio
  esProductoIntermedio: z.boolean().optional().default(false),
  rendimiento: z.number().positive().optional(),
  unidadRendimiento: z.string().optional(),
});

const updateProductoSchema = createProductoSchema.partial();

const updateStockSchema = z.object({
  cantidad: z.number().int('La cantidad debe ser un número entero'),
});

export class ProductoController {
  constructor(private productoService: ProductoService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validatedData = createProductoSchema.parse(req.body);
      
      const producto = await this.productoService.createProducto(tenantId, validatedData);
      
      res.status(201).json(producto);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { categoriaId, disponible, search } = req.query;

      const filters = {
        categoriaId: categoriaId as string,
        disponible: disponible === 'true' ? true : disponible === 'false' ? false : undefined,
        search: search as string,
      };

      const productos = await this.productoService.getProductos(tenantId, filters);
      
      res.json(productos);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const producto = await this.productoService.getProductoById(tenantId, id);
      
      res.json(producto);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const validatedData = updateProductoSchema.parse(req.body);

      const producto = await this.productoService.updateProducto(tenantId, id, validatedData);
      
      res.json(producto);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await this.productoService.deleteProducto(tenantId, id);
      
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

      const producto = await this.productoService.updateStock(tenantId, id, cantidad);
      
      res.json(producto);
    } catch (error) {
      next(error);
    }
  }

  async getBajoStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const productos = await this.productoService.getProductosBajoStock(tenantId);
      
      res.json(productos);
    } catch (error) {
      next(error);
    }
  }
}
