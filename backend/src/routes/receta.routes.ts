import { Router } from 'express';
import { RecetaController } from '../controllers/receta.controller';
import { RecetaService } from '../services/receta.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const recetaService = new RecetaService();
const recetaController = new RecetaController(recetaService);

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/producto/:productoId', recetaController.getByProducto.bind(recetaController));
router.get('/producto/:productoId/costo', recetaController.calcularCosto.bind(recetaController));
router.post('/', recetaController.create.bind(recetaController));
router.put('/:id', recetaController.update.bind(recetaController));
router.delete('/:id', recetaController.delete.bind(recetaController));

export { router as recetaRoutes };
