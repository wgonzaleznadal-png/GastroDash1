import { Router } from 'express';
import { articuloController } from '../controllers/articulo.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD básico
router.get('/', articuloController.getAll);
router.get('/estadisticas', articuloController.getEstadisticas);
router.get('/buscar', articuloController.buscar);
router.get('/:id', articuloController.getById);
router.post('/', articuloController.create);
router.put('/:id', articuloController.update);
router.delete('/:id', articuloController.delete);

// Alias
router.post('/:id/alias', articuloController.agregarAlias);
router.delete('/:id/alias/:aliasId', articuloController.eliminarAlias);

// Stock
router.post('/:id/stock', articuloController.actualizarStock);

export default router;
