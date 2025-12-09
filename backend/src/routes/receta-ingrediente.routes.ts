import { Router } from 'express';
import { recetaIngredienteController } from '../controllers/receta-ingrediente.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rutas de recetas de ingredientes
router.post('/', recetaIngredienteController.addComponente.bind(recetaIngredienteController));
router.get('/ingrediente/:ingredienteId', recetaIngredienteController.getRecetasByIngrediente.bind(recetaIngredienteController));
router.get('/ingrediente/:ingredienteId/costo', recetaIngredienteController.calcularCosto.bind(recetaIngredienteController));
router.delete('/:id', recetaIngredienteController.deleteReceta.bind(recetaIngredienteController));

export { router as recetaIngredienteRoutes };
