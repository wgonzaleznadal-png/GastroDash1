import { Request, Response, NextFunction } from 'express';
import { articuloService, CreateArticuloDTO, UpdateArticuloDTO, ArticuloFilters } from '../services/articulo.service';
import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const TipoArticuloEnum = z.enum(['INGREDIENTE', 'PRODUCTO_DIRECTO', 'INSUMO', 'GASTO_SERVICIO']);
const CategoriaArticuloEnum = z.enum([
  'ALIMENTOS', 'BEBIDAS_ALCOHOLICAS', 'BEBIDAS_SIN_ALCOHOL',
  'LIMPIEZA', 'DESCARTABLES', 'UTENSILIOS',
  'SERVICIOS', 'ALQUILER', 'IMPUESTOS', 'SUELDOS', 'OTROS'
]);
const UbicacionStockEnum = z.enum(['COCINA', 'BAR', 'DEPOSITO', 'HELADERA', 'FREEZER', 'MOSTRADOR']);
const UnidadMedidaEnum = z.enum([
  'KG', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'DOCENA',
  'CAJA', 'BANDEJA', 'PAQUETE', 'BOLSA', 'LATA', 'BOTELLA', 'SOBRE', 'MAPLE'
]);

const createArticuloSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  codigoInterno: z.string().optional(),
  codigoBarras: z.string().optional(),
  tipo: TipoArticuloEnum,
  categoria: CategoriaArticuloEnum,
  afectaStock: z.boolean().optional().default(true),
  stockActual: z.number().optional().default(0),
  stockMinimo: z.number().optional().default(0),
  unidad: UnidadMedidaEnum,
  ubicacion: UbicacionStockEnum.optional(),
  costoPromedio: z.number().optional().default(0),
  costoUltimo: z.number().optional().default(0),
  seVende: z.boolean().optional().default(false),
  precioVenta: z.number().optional(),
  marca: z.string().optional(),
  esGenerico: z.boolean().optional().default(true),
  articuloGenericoId: z.string().uuid().optional(),
});

const updateArticuloSchema = createArticuloSchema.partial();

// ============================================
// CONTROLLER
// ============================================

class ArticuloController {

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      
      const filters: ArticuloFilters = {
        tipo: req.query.tipo as any,
        categoria: req.query.categoria as any,
        ubicacion: req.query.ubicacion as any,
        activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined,
        seVende: req.query.seVende === 'true' ? true : req.query.seVende === 'false' ? false : undefined,
        stockBajo: req.query.stockBajo === 'true',
        search: req.query.search as string,
      };

      const articulos = await articuloService.getAll(tenantId, filters);
      res.json(articulos);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const articulo = await articuloService.getById(tenantId, id);
      
      if (!articulo) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
      }

      res.json(articulo);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const validatedData = createArticuloSchema.parse(req.body);
      const articulo = await articuloService.create(tenantId, validatedData as CreateArticuloDTO, userId);
      
      res.status(201).json(articulo);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const validatedData = updateArticuloSchema.parse(req.body);
      const articulo = await articuloService.update(tenantId, id, validatedData as UpdateArticuloDTO);
      
      res.json(articulo);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      if (error.message === 'Artículo no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await articuloService.delete(tenantId, id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Artículo no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async buscar(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { texto } = req.query;

      if (!texto || typeof texto !== 'string') {
        return res.status(400).json({ error: 'El parámetro texto es requerido' });
      }

      const resultado = await articuloService.buscarPorTexto(tenantId, texto);
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async agregarAlias(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { alias } = req.body;

      if (!alias || typeof alias !== 'string') {
        return res.status(400).json({ error: 'El alias es requerido' });
      }

      const resultado = await articuloService.agregarAlias(tenantId, id, alias);
      res.status(201).json(resultado);
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('ya está asignado')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async eliminarAlias(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { aliasId } = req.params;

      await articuloService.eliminarAlias(tenantId, aliasId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async actualizarStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { cantidad, operacion, costoUnitario } = req.body;

      if (typeof cantidad !== 'number' || !['SUMAR', 'RESTAR', 'ESTABLECER'].includes(operacion)) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }

      const articulo = await articuloService.actualizarStock(
        tenantId, 
        id, 
        cantidad, 
        operacion,
        costoUnitario
      );
      
      res.json(articulo);
    } catch (error: any) {
      if (error.message.includes('no encontrado') || error.message.includes('no afecta stock')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Stock insuficiente') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const estadisticas = await articuloService.getEstadisticas(tenantId);
      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }
}

export const articuloController = new ArticuloController();
