import { Router } from 'express';
import { comprobanteController, upload } from '../controllers/comprobante.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// OCR - debe ir antes de las rutas con :id para evitar conflictos
router.post('/ocr', upload.single('image'), comprobanteController.processOcr);

// CRUD básico
router.get('/', comprobanteController.getAll);
router.get('/estadisticas', comprobanteController.getEstadisticas);
router.get('/:id', comprobanteController.getById);
router.post('/', comprobanteController.create);
router.put('/:id', comprobanteController.update);
router.delete('/:id', comprobanteController.delete);

// Operaciones especiales
router.post('/:id/recibir', comprobanteController.recibir);
router.post('/:id/anular', comprobanteController.anular);
router.post('/items/:itemId/asignar-articulo', comprobanteController.asignarArticulo);

export default router;
