# 📦 SISTEMA DE INVENTARIO Y COMPRAS - ARQUITECTURA CORRECTA

## 🎯 CONCEPTO FUNDAMENTAL

**La Administración es la base del sistema. Todo pasa por Administración.**

El sistema se divide en **3 niveles claramente separados**:

1. **🔵 COCINA** - Ve ingredientes genéricos (conceptos)
2. **🟢 ADMINISTRACIÓN** - Maneja compras, marcas, proveedores, facturas
3. **🟡 INVENTARIO** - Vista automática de stock y costos

---

## 📋 NIVEL 1: INGREDIENTES (COCINA)

### Concepto
Los ingredientes representan **conceptos genéricos**, NO marcas específicas.

### Ejemplos Correctos
- ✅ Arroz
- ✅ Harina 000
- ✅ Aceite
- ✅ Tomate
- ✅ Pan casero (si es elaborado internamente)
- ✅ Mayonesa casera

### Campos del Modelo

```prisma
model Ingrediente {
  id                String
  tenantId          String
  nombre            String        // "Arroz", "Harina 000"
  descripcion       String?       // Opcional
  costoPromedio     Decimal?      // Para Administración (análisis financiero)
  costoUltimo       Decimal?      // Para Cocina (precio de reposición)
  unidad            UnidadMedida  // kg, lt, unidad, etc.
  esCompuesto       Boolean       // true si tiene receta
  stockActual       Decimal       // Se actualiza automáticamente
  stockMinimo       Decimal       // Para alertas
  activo            Boolean
  
  // Relaciones
  recetas           Receta[]              // Si es compuesto
  recetasIngrediente RecetaIngrediente[]  // Componentes
  itemsCompra       ItemCompra[]          // Compras que lo incluyen
}
```

### Características
- ✅ **Nombre genérico**: Sin marcas
- ✅ **Costo promedio**: Para Administración (análisis financiero)
- ✅ **Costo último**: Para Cocina (precio de reposición - última compra)
- ✅ **Stock actual**: Actualizado por compras y ventas
- ✅ **Puede ser simple o compuesto**: Con receta interna
- ❌ **NO tiene marca**: Eso es nivel Administración
- ❌ **NO se carga stock manualmente**: Se actualiza por compras

### Diferencia entre Costos
- **costoPromedio**: Promedio ponderado de todas las compras (para análisis de rentabilidad)
- **costoUltimo**: Precio de la última compra recibida (para saber cuánto cuesta reponer)

---

## 🏢 NIVEL 2: COMPRAS (ADMINISTRACIÓN)

### Concepto
Administración carga **facturas completas** con todos los insumos que llegan.

### Modelo Proveedor

```prisma
model Proveedor {
  id          String
  tenantId    String
  nombre      String
  razonSocial String?
  cuit        String?
  telefono    String?
  email       String?
  direccion   String?
  contacto    String?
  activo      Boolean
  compras     Compra[]
}
```

### Modelo Compra

```prisma
model Compra {
  id              String
  tenantId        String
  proveedorId     String
  usuarioId       String
  numero          Int           // Correlativo
  numeroFactura   String?       // Número de factura del proveedor
  fechaCompra     DateTime
  fechaEntrega    DateTime?
  subtotal        Decimal
  impuestos       Decimal
  descuentos      Decimal
  total           Decimal
  estado          String        // PENDIENTE, RECIBIDA, PARCIAL, CANCELADA
  observaciones   String?
  
  // Relaciones
  proveedor       Proveedor
  usuario         Usuario
  items           ItemCompra[]
}
```

### Modelo ItemCompra

```prisma
model ItemCompra {
  id                String
  compraId          String
  ingredienteId     String      // Referencia al ingrediente genérico
  marca             String?     // "Molinos Ala", "Arcor", etc.
  cantidadComprada  Decimal
  unidad            UnidadMedida
  precioUnitario    Decimal     // Precio por unidad
  precioTotal       Decimal     // Cantidad * Precio
  cantidadRecibida  Decimal?    // Al recibir la compra
  fechaRecepcion    DateTime?
  observaciones     String?
  
  // Relaciones
  compra            Compra
  ingrediente       Ingrediente
}
```

### Flujo de Compra

#### 1. Crear Compra
```typescript
POST /api/compras
{
  proveedorId: "uuid",
  numeroFactura: "0001-00001234",
  fechaCompra: "2024-12-04",
  subtotal: 10000,
  impuestos: 2100,
  descuentos: 0,
  total: 12100,
  items: [
    {
      ingredienteId: "uuid-arroz",      // Ingrediente genérico "Arroz"
      marca: "Molinos Ala",             // Marca específica
      cantidadComprada: 25,             // 25 kg
      unidad: "KG",
      precioUnitario: 400,              // $400/kg
      precioTotal: 10000                // 25 * 400
    }
  ]
}
```

**Estado inicial**: PENDIENTE

#### 2. Recibir Compra
```typescript
POST /api/compras/:id/recibir
{
  items: [
    {
      itemId: "uuid",
      cantidadRecibida: 25  // Confirmar cantidad
    }
  ]
}
```

**Al recibir, el sistema automáticamente**:
1. ✅ Suma stock al ingrediente genérico
2. ✅ Calcula nuevo costo promedio ponderado
3. ✅ Actualiza costo último con el precio de esta compra
4. ✅ Actualiza estado de la compra a RECIBIDA
5. ✅ Registra fecha de recepción

---

## 🧮 CÁLCULO DE COSTO PROMEDIO PONDERADO

### Fórmula

```
Costo Promedio = (Stock Actual × Costo Actual + Cantidad Nueva × Precio Nuevo) / (Stock Actual + Cantidad Nueva)
```

### Ejemplo Práctico

**Estado Inicial**:
- Ingrediente: Arroz
- Stock Actual: 10 kg
- Costo Actual: $350/kg

**Nueva Compra**:
- Cantidad: 25 kg
- Precio: $400/kg

**Cálculo**:
```
Costo Promedio = (10 × 350 + 25 × 400) / (10 + 25)
               = (3500 + 10000) / 35
               = 13500 / 35
               = $385.71/kg
```

**Resultado**:
- Nuevo Stock: 35 kg
- Nuevo Costo Promedio: $385.71/kg
- Nuevo Costo Último: $400/kg (precio de esta compra)

### Implementación

```typescript
private async updateIngredienteStockAndCost(
  tx: any,
  ingredienteId: string,
  cantidadNueva: number,
  precioNuevo: number
) {
  const ingrediente = await tx.ingrediente.findUnique({
    where: { id: ingredienteId },
  });

  const stockActual = Number(ingrediente.stockActual);
  const costoActual = Number(ingrediente.costoPromedio || 0);
  
  // Nuevo stock
  const nuevoStock = stockActual + cantidadNueva;
  
  // Costo promedio ponderado
  let nuevoCostoPromedio;
  if (stockActual === 0) {
    nuevoCostoPromedio = precioNuevo;
  } else {
    nuevoCostoPromedio = 
      (stockActual * costoActual + cantidadNueva * precioNuevo) / nuevoStock;
  }
  
  // Actualizar
  await tx.ingrediente.update({
    where: { id: ingredienteId },
    data: {
      stockActual: nuevoStock,
      costoPromedio: nuevoCostoPromedio,
      costoUltimo: precioNuevo, // Precio de reposición
    },
  });
}
```

---

## 📊 NIVEL 3: INVENTARIO (VISTA AUTOMÁTICA)

### Concepto
El inventario **NO se carga manualmente**. Es una vista de solo lectura.

### Se Actualiza Automáticamente Cuando:
1. ✅ Administración recibe una compra → **Suma stock**
2. ✅ Se registra una venta → **Descuenta stock** (según recetas)
3. ✅ Cocina registra una merma → **Descuenta stock**

### Vista de Inventario

```typescript
GET /api/inventario
```

**Respuesta**:
```json
[
  {
    "id": "uuid",
    "nombre": "Arroz",
    "unidad": "KG",
    "stockActual": 35,
    "costoPromedio": 385.71,
    "stockMinimo": 10,
    "estado": "OK" // OK, BAJO, CRITICO
  }
]
```

### Campos Visibles
- ✅ Nombre del ingrediente
- ✅ Unidad
- ✅ Stock actual
- ✅ Costo promedio
- ✅ Stock mínimo
- ✅ Estado (OK/BAJO/CRITICO)

### Campos NO Visibles
- ❌ Marcas
- ❌ Proveedores
- ❌ Precios específicos
- ❌ Facturas

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

### 1. Administración Compra Insumos

```
ADMINISTRACIÓN
    ↓
Carga factura completa
    ↓
Registra proveedor, marca, precio
    ↓
Estado: PENDIENTE
```

### 2. Recepción de Mercadería

```
ADMINISTRACIÓN
    ↓
Recibe mercadería física
    ↓
Confirma cantidades
    ↓
SISTEMA AUTOMÁTICO:
  - Suma stock al ingrediente genérico
  - Calcula costo promedio ponderado
  - Actualiza inventario
    ↓
Estado: RECIBIDA
```

### 3. Cocina Usa Ingredientes

```
COCINA
    ↓
Ve ingredientes genéricos
    ↓
Crea recetas con ingredientes
    ↓
Prepara productos
```

### 4. Venta de Productos

```
VENTAS
    ↓
Se vende un producto
    ↓
SISTEMA AUTOMÁTICO:
  - Lee receta del producto
  - Descuenta ingredientes según receta
  - Actualiza stock
  - Actualiza inventario
```

### 5. Inventario Siempre Actualizado

```
INVENTARIO
    ↓
Vista de solo lectura
    ↓
Muestra stock actual
    ↓
Muestra costo promedio
    ↓
Genera alertas si stock bajo
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

### Backend

```
backend/
├── prisma/
│   └── schema.prisma
│       ├── Proveedor
│       ├── Compra
│       ├── ItemCompra
│       └── Ingrediente (modificado)
│
├── src/
│   ├── services/
│   │   ├── proveedor.service.ts
│   │   ├── compra.service.ts
│   │   └── ingrediente.service.ts (actualizar)
│   │
│   ├── controllers/
│   │   ├── proveedor.controller.ts
│   │   ├── compra.controller.ts
│   │   └── ingrediente.controller.ts (actualizar)
│   │
│   └── routes/
│       ├── proveedor.routes.ts
│       ├── compra.routes.ts
│       └── ingrediente.routes.ts (actualizar)
```

### Frontend (Pendiente)

```
frontend/
├── src/app/dashboard/
│   ├── compras/              # NUEVO - Administración
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── FormularioCompra.tsx
│   │       ├── ListaCompras.tsx
│   │       └── RecepcionCompra.tsx
│   │
│   ├── proveedores/          # NUEVO - Administración
│   │   ├── page.tsx
│   │   └── components/
│   │       └── FormularioProveedor.tsx
│   │
│   ├── ingredientes/         # ACTUALIZAR - Cocina
│   │   └── page.tsx          # Simplificar (sin costo manual)
│   │
│   └── inventario/           # ACTUALIZAR - Solo lectura
│       └── page.tsx          # Vista simple
```

---

## 🎯 ENDPOINTS API

### Proveedores

```
POST   /api/proveedores              - Crear proveedor
GET    /api/proveedores              - Listar proveedores
GET    /api/proveedores/:id          - Ver proveedor
PATCH  /api/proveedores/:id          - Actualizar proveedor
DELETE /api/proveedores/:id          - Eliminar proveedor
```

### Compras

```
POST   /api/compras                  - Crear compra
GET    /api/compras                  - Listar compras
GET    /api/compras/estadisticas     - Estadísticas
GET    /api/compras/:id              - Ver compra
PATCH  /api/compras/:id              - Actualizar compra
POST   /api/compras/:id/recibir      - Recibir compra
POST   /api/compras/:id/cancelar     - Cancelar compra
```

### Ingredientes (Actualizado)

```
POST   /api/ingredientes             - Crear ingrediente (sin costo)
GET    /api/ingredientes             - Listar ingredientes
GET    /api/ingredientes/:id         - Ver ingrediente
PATCH  /api/ingredientes/:id         - Actualizar ingrediente
DELETE /api/ingredientes/:id         - Eliminar ingrediente
```

### Inventario (Solo Lectura)

```
GET    /api/inventario               - Ver inventario completo
GET    /api/inventario/alertas       - Ver alertas de stock
```

---

## ✅ VENTAJAS DEL NUEVO SISTEMA

### 1. Separación Clara de Responsabilidades
- **Cocina**: Solo ve conceptos genéricos
- **Administración**: Maneja toda la complejidad
- **Inventario**: Vista simple y automática

### 2. Costo Promedio Automático
- No hay que calcular manualmente
- Siempre refleja el costo real
- Se actualiza con cada compra

### 3. Trazabilidad Completa
- Cada compra registra marca y proveedor
- Historial completo de precios
- Auditoría de movimientos

### 4. Flexibilidad
- Mismo ingrediente, múltiples marcas
- Diferentes proveedores
- Precios variables en el tiempo

### 5. Simplicidad para Cocina
- No necesita saber de marcas
- No necesita saber de precios
- Solo trabaja con conceptos

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Backend completado**
   - Modelos creados
   - Servicios implementados
   - Controladores listos
   - Rutas registradas

2. ⏳ **Frontend pendiente**
   - Crear página de Compras
   - Crear página de Proveedores
   - Actualizar página de Ingredientes
   - Actualizar página de Inventario

3. ⏳ **Integración con Ventas**
   - Descuento automático de stock
   - Basado en recetas de productos

4. ⏳ **Reportes y Estadísticas**
   - Compras por período
   - Proveedores más usados
   - Evolución de precios
   - Rotación de inventario

---

## 📝 RESUMEN

**El nuevo sistema establece una jerarquía clara:**

```
ADMINISTRACIÓN (Base)
    ↓
Carga compras con marcas y precios
    ↓
SISTEMA AUTOMÁTICO
    ↓
Actualiza stock y costo promedio
    ↓
COCINA (Usa)
    ↓
Ve ingredientes genéricos
    ↓
INVENTARIO (Monitorea)
    ↓
Vista automática de stock
```

**Todo pasa por Administración. Sin compra, no hay stock. Sin stock, no hay producción.**

✅ **Sistema listo para producción en el backend!**
