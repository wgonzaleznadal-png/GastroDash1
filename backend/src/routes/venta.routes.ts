import { Router } from 'express';
import { VentaController } from '../controllers/venta.controller';
import { VentaService } from '../services/venta.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const ventaService = new VentaService();
const ventaController = new VentaController(ventaService);

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', ventaController.getAll.bind(ventaController));
router.get('/estadisticas', ventaController.getEstadisticas.bind(ventaController));
router.get('/:id', ventaController.getById.bind(ventaController));
router.post('/', ventaController.create.bind(ventaController));
router.patch('/:id/cancelar', ventaController.cancelar.bind(ventaController));

export { router as ventaRoutes };
