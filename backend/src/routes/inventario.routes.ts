import { Router } from 'express';
import { InventarioController } from '../controllers/inventario.controller';
import { InventarioService } from '../services/inventario.service';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();
const inventarioService = new InventarioService(prisma);
const inventarioController = new InventarioController(inventarioService);

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// Movimientos de stock
router.post('/movimientos', (req, res, next) =>
  inventarioController.registrarMovimiento(req, res, next)
);
router.get('/movimientos', (req, res, next) =>
  inventarioController.getMovimientos(req, res, next)
);

// Ajustes de inventario
router.post('/ajustes', (req, res, next) =>
  inventarioController.crearAjuste(req, res, next)
);
router.get('/ajustes', (req, res, next) =>
  inventarioController.getAjustes(req, res, next)
);
router.post('/ajustes/:id/aprobar', (req, res, next) =>
  inventarioController.aprobarAjuste(req, res, next)
);

// Alertas
router.get('/alertas', (req, res, next) =>
  inventarioController.getAlertas(req, res, next)
);
router.patch('/alertas/:id/leer', (req, res, next) =>
  inventarioController.marcarAlertaLeida(req, res, next)
);
router.post('/alertas/leer-todas', (req, res, next) =>
  inventarioController.marcarTodasLeidas(req, res, next)
);

// Reportes
router.get('/reporte', (req, res, next) =>
  inventarioController.getReporte(req, res, next)
);
router.get('/historial/:productoId', (req, res, next) =>
  inventarioController.getHistorialProducto(req, res, next)
);

export { router as inventarioRoutes };
