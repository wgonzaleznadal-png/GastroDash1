import { Router } from 'express';
import { ProductoController } from '../controllers/producto.controller';
import { ProductoService } from '../services/producto.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const productoService = new ProductoService();
const productoController = new ProductoController(productoService);

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/productos - Listar todos los productos
router.get('/', productoController.getAll.bind(productoController));

// GET /api/productos/bajo-stock - Productos con stock bajo
router.get('/bajo-stock', productoController.getBajoStock.bind(productoController));

// GET /api/productos/:id - Obtener un producto
router.get('/:id', productoController.getById.bind(productoController));

// POST /api/productos - Crear producto
router.post('/', productoController.create.bind(productoController));

// PUT /api/productos/:id - Actualizar producto
router.put('/:id', productoController.update.bind(productoController));

// PATCH /api/productos/:id/stock - Actualizar stock
router.patch('/:id/stock', productoController.updateStock.bind(productoController));

// DELETE /api/productos/:id - Eliminar producto
router.delete('/:id', productoController.delete.bind(productoController));

export { router as productoRoutes };
