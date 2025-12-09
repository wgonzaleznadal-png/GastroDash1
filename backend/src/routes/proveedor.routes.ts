import { Router } from 'express';
import { ProveedorController } from '../controllers/proveedor.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();
const proveedorController = new ProveedorController();

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

router.post('/', proveedorController.create.bind(proveedorController));
router.get('/', proveedorController.getAll.bind(proveedorController));
router.get('/:id', proveedorController.getById.bind(proveedorController));
router.patch('/:id', proveedorController.update.bind(proveedorController));
router.delete('/:id', proveedorController.delete.bind(proveedorController));

export default router;
