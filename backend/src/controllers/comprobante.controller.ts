import { Request, Response, NextFunction } from 'express';
import { comprobanteService, CreateComprobanteDTO, ComprobanteFilters } from '../services/comprobante.service';
import { ocrService } from '../services/ocr.service';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar multer para subida de archivos
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const TipoComprobanteEnum = z.enum([
  'FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'TICKET', 'RECIBO', 'REMITO', 'GASTO_INTERNO'
]);

const UnidadMedidaEnum = z.enum([
  'KG', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'DOCENA',
  'CAJA', 'BANDEJA', 'PAQUETE', 'BOLSA', 'LATA', 'BOTELLA', 'SOBRE', 'MAPLE'
]);

const TipoArticuloEnum = z.enum(['INGREDIENTE', 'PRODUCTO_DIRECTO', 'INSUMO', 'GASTO_SERVICIO']);
const CategoriaEnum = z.enum([
  'ALIMENTOS', 'BEBIDAS_ALCOHOLICAS', 'BEBIDAS_SIN_ALCOHOL', 
  'LIMPIEZA', 'DESCARTABLES', 'UTENSILIOS', 'SERVICIOS', 'OTROS'
]);

const itemComprobanteSchema = z.object({
  articuloId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
  tipoArticulo: TipoArticuloEnum.optional().or(z.literal('')).transform(v => v || undefined),
  categoria: CategoriaEnum.optional().or(z.literal('')).transform(v => v || undefined),
  marca: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  descripcionOriginal: z.string().min(1),
  cantidad: z.number().positive(),
  unidad: UnidadMedidaEnum,
  precioUnitario: z.number().min(0),
  precioTotal: z.number().min(0),
  observaciones: z.string().optional(),
});

const createComprobanteSchema = z.object({
  tipoComprobante: TipoComprobanteEnum,
  proveedorId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
  fecha: z.string().optional(),
  numeroComprobante: z.string().optional(),
  subtotal: z.number().min(0),
  impuestos: z.number().min(0).optional(),
  descuentos: z.number().min(0).optional(),
  total: z.number().min(0),
  observaciones: z.string().optional(),
  imagenUrl: z.string().optional(),
  items: z.array(itemComprobanteSchema).min(1),
});

const recibirItemsSchema = z.array(z.object({
  itemId: z.string().uuid(),
  cantidadRecibida: z.number().min(0),
  observaciones: z.string().optional(),
}));

// ============================================
// CONTROLLER
// ============================================

class ComprobanteController {

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      
      const filters: ComprobanteFilters = {
        tipoComprobante: req.query.tipoComprobante as any,
        estado: req.query.estado as any,
        proveedorId: req.query.proveedorId as string,
        fechaDesde: req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined,
        fechaHasta: req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined,
        search: req.query.search as string,
      };

      const comprobantes = await comprobanteService.getAll(tenantId, filters);
      res.json(comprobantes);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const comprobante = await comprobanteService.getById(tenantId, id);
      
      if (!comprobante) {
        return res.status(404).json({ error: 'Comprobante no encontrado' });
      }

      res.json(comprobante);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;

      const validatedData = createComprobanteSchema.parse(req.body);
      
      // Convertir fecha si viene como string
      const data: CreateComprobanteDTO = {
        ...validatedData,
        fecha: validatedData.fecha ? new Date(validatedData.fecha) : undefined,
      };

      const comprobante = await comprobanteService.create(tenantId, userId, data);
      
      res.status(201).json(comprobante);
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

      const comprobante = await comprobanteService.update(tenantId, id, req.body);
      res.json(comprobante);
    } catch (error: any) {
      if (error.message === 'Comprobante no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Solo se pueden')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await comprobanteService.delete(tenantId, id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Comprobante no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Solo se pueden')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async recibir(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const items = recibirItemsSchema.parse(req.body.items);
      const comprobante = await comprobanteService.recibirComprobante(tenantId, id, items);
      
      res.json(comprobante);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('ya fue recibido') || error.message.includes('anulado')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async asignarArticulo(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { itemId } = req.params;
      const { articuloId, crearAlias } = req.body;

      if (!articuloId) {
        return res.status(400).json({ error: 'articuloId es requerido' });
      }

      const item = await comprobanteService.asignarArticuloAItem(
        tenantId, 
        itemId, 
        articuloId,
        crearAlias !== false
      );
      
      res.json(item);
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async anular(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({ error: 'El motivo es requerido' });
      }

      const comprobante = await comprobanteService.anularComprobante(tenantId, id, motivo);
      res.json(comprobante);
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('ya está anulado')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined;
      const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined;

      const estadisticas = await comprobanteService.getEstadisticas(tenantId, fechaDesde, fechaHasta);
      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }

  async processOcr(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
      }

      const tenantId = req.tenantId;
      const result = await ocrService.processImage(req.file.path, tenantId);

      // Limpiar archivo temporal después de procesar
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error eliminando archivo temporal:', err);
      });

      res.json(result);
    } catch (error: any) {
      // Limpiar archivo temporal en caso de error
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      next(error);
    }
  }
}

export const comprobanteController = new ComprobanteController();
