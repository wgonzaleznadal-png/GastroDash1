import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { productoRoutes } from './producto.routes';
import { categoriaRoutes } from './categoria.routes';
import { usuarioRoutes } from './usuario.routes';
import { ventaRoutes } from './venta.routes';
import { turnoRoutes } from './turno.routes';
import { mesaRoutes } from './mesa.routes';
import { ingredienteRoutes } from './ingrediente.routes';
import { recetaRoutes } from './receta.routes';
import { recetaIngredienteRoutes } from './receta-ingrediente.routes';
import { inventarioRoutes } from './inventario.routes';
import cocinaRoutes from './cocina.routes';
import proveedorRoutes from './proveedor.routes';
import compraRoutes from './compra.routes';
// v2.0 - Nuevas rutas
import articuloRoutes from './articulo.routes';
import comprobanteRoutes from './comprobante.routes';
import configRoutes from './config.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/ventas', ventaRoutes);
router.use('/turnos', turnoRoutes);
router.use('/mesas', mesaRoutes);
router.use('/ingredientes', ingredienteRoutes);
router.use('/recetas', recetaRoutes);
router.use('/recetas-ingredientes', recetaIngredienteRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/cocina', cocinaRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/compras', compraRoutes);
// v2.0 - Nuevas rutas
router.use('/articulos', articuloRoutes);
router.use('/comprobantes', comprobanteRoutes);
router.use('/config', configRoutes);

export { router as routes };
