# 🎯 SISTEMA DE PRODUCTOS INTERMEDIOS

## 📋 Concepto

Productos que tienen receta propia y se usan como ingredientes en otros productos.

### Ejemplos
- **Mayonesa Casera**: Producto con receta → Se usa en Hamburguesas
- **Pan Casero**: Producto con receta → Se usa en Sandwiches  
- **Salsa BBQ**: Producto con receta → Se usa en Costillas

---

## 🏗️ Cambios en la Base de Datos

### Modelo Producto (Modificado)

```prisma
model Producto {
  // ... campos existentes ...
  
  // NUEVO: Producto Intermedio
  esProductoIntermedio Boolean      @default(false)
  rendimiento          Decimal?     @db.Decimal(10, 3)
  unidadRendimiento    UnidadMedida?
  
  // NUEVO: Relación con ingrediente
  ingredienteVinculado Ingrediente?
}
```

**Nuevos Campos:**
- `esProductoIntermedio`: Indica si este producto también es ingrediente
- `rendimiento`: Cantidad que produce (ej: 1000 ml, 500 g)
- `unidadRendimiento`: Unidad del rendimiento (LITRO, KILOGRAMO, etc.)

### Modelo Ingrediente (Modificado)

```prisma
model Ingrediente {
  // ... campos existentes ...
  
  // NUEVO: Producto Vinculado
  productoVinculadoId String?   @unique
  productoVinculado   Producto? @relation(fields: [productoVinculadoId])
}
```

**Nuevo Campo:**
- `productoVinculadoId`: ID del producto del cual se calcula el costo

---

## 🔄 Flujo de Funcionamiento

### 1. Crear Producto Intermedio

```typescript
// Usuario crea "Mayonesa Casera"
POST /api/productos
{
  "nombre": "Mayonesa Casera",
  "esProductoIntermedio": true,  // ← Checkbox marcado
  "rendimiento": 1000,            // ← Produce 1000 ml
  "unidadRendimiento": "MILILITRO",
  "categoriaId": "...",
  "precio": 500,  // Precio si se vende sola
  "stock": 0
}
```

### 2. Agregar Receta al Producto

```typescript
// Receta de la Mayonesa
POST /api/recetas
{
  "productoId": "[id-mayonesa]",
  "ingredienteId": "[id-huevo]",
  "cantidad": 2,
  "unidad": "UNIDAD"
}

POST /api/recetas
{
  "productoId": "[id-mayonesa]",
  "ingredienteId": "[id-aceite]",
  "cantidad": 400,
  "unidad": "MILILITRO"
}

// Costo calculado: $900
```

### 3. Auto-Crear Ingrediente Vinculado

```typescript
// El sistema automáticamente crea:
POST /api/ingredientes (automático)
{
  "nombre": "Mayonesa Casera",
  "costo": 0.90,  // $900 ÷ 1000 ml
  "unidad": "MILILITRO",
  "productoVinculadoId": "[id-mayonesa]",
  "descripcion": "Auto-generado desde producto intermedio"
}
```

### 4. Usar en Otra Receta

```typescript
// Usuario crea "Hamburguesa"
// En la receta, selecciona "Mayonesa Casera" (ahora disponible como ingrediente)
POST /api/recetas
{
  "productoId": "[id-hamburguesa]",
  "ingredienteId": "[id-ingrediente-mayonesa]",
  "cantidad": 50,
  "unidad": "MILILITRO"
}

// Costo: 50 ml × $0.90/ml = $45
```

### 5. Actualización Automática

```typescript
// Si cambias la receta de la Mayonesa:
// - Nuevo costo: $1,200
// - Nuevo costo por ml: $1.20

// El sistema automáticamente:
// 1. Actualiza el ingrediente vinculado: costo = $1.20/ml
// 2. Recalcula todas las recetas que usan Mayonesa
// 3. Actualiza el costo de la Hamburguesa
```

---

## 💻 Implementación Backend

### Servicio de Productos Intermedios

```typescript
// backend/src/services/producto-intermedio.service.ts

export class ProductoIntermedioService {
  
  async crearProductoIntermedio(
    tenantId: string,
    productoId: string,
    rendimiento: number,
    unidad: UnidadMedida
  ) {
    // 1. Obtener producto y su costo
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      include: { recetas: { include: { ingrediente: true } } }
    });
    
    // 2. Calcular costo por unidad
    const costoTotal = producto.costo || 0;
    const costoPorUnidad = costoTotal / rendimiento;
    
    // 3. Crear o actualizar ingrediente vinculado
    const ingrediente = await prisma.ingrediente.upsert({
      where: { productoVinculadoId: productoId },
      create: {
        tenantId,
        nombre: producto.nombre,
        descripcion: `Auto-generado desde producto intermedio`,
        costo: costoPorUnidad,
        unidad: unidad,
        productoVinculadoId: productoId,
        stockActual: 0,
        stockMinimo: 0,
        activo: true
      },
      update: {
        costo: costoPorUnidad,
        unidad: unidad
      }
    });
    
    return ingrediente;
  }
  
  async actualizarCostoIngredienteVinculado(productoId: string) {
    // Buscar ingrediente vinculado
    const ingrediente = await prisma.ingrediente.findUnique({
      where: { productoVinculadoId: productoId },
      include: { productoVinculado: true }
    });
    
    if (!ingrediente) return;
    
    const producto = ingrediente.productoVinculado;
    const costoTotal = producto.costo || 0;
    const rendimiento = producto.rendimiento || 1;
    const costoPorUnidad = costoTotal / rendimiento;
    
    // Actualizar costo del ingrediente
    await prisma.ingrediente.update({
      where: { id: ingrediente.id },
      data: { costo: costoPorUnidad }
    });
    
    // Recalcular productos que usan este ingrediente
    await this.recalcularProductosQueUsanIngrediente(ingrediente.id);
  }
  
  async recalcularProductosQueUsanIngrediente(ingredienteId: string) {
    // Obtener todas las recetas que usan este ingrediente
    const recetas = await prisma.receta.findMany({
      where: { ingredienteId },
      include: { producto: true }
    });
    
    // Recalcular costo de cada producto
    for (const receta of recetas) {
      await recetaService.calcularCosto(receta.productoId);
    }
  }
}
```

### Modificar Servicio de Productos

```typescript
// backend/src/services/producto.service.ts

async createProducto(tenantId: string, data: CreateProductoDTO) {
  // ... código existente ...
  
  const producto = await this.create(tenantId, productoData);
  
  // Si es producto intermedio, crear ingrediente vinculado
  if (data.esProductoIntermedio && data.rendimiento && data.unidadRendimiento) {
    await productoIntermedioService.crearProductoIntermedio(
      tenantId,
      producto.id,
      data.rendimiento,
      data.unidadRendimiento
    );
  }
  
  return producto;
}

async updateProducto(tenantId: string, id: string, data: UpdateProductoDTO) {
  // ... código existente ...
  
  const producto = await prisma.producto.update({
    where: { id },
    data: updateData
  });
  
  // Si tiene ingrediente vinculado, actualizar su costo
  await productoIntermedioService.actualizarCostoIngredienteVinculado(id);
  
  return producto;
}
```

### Modificar Servicio de Recetas

```typescript
// backend/src/services/receta.service.ts

async create(data: CreateRecetaDTO) {
  const receta = await prisma.receta.create({ data });
  
  // Recalcular costo del producto
  await this.calcularCosto(data.productoId);
  
  // Si el producto es intermedio, actualizar ingrediente vinculado
  const producto = await prisma.producto.findUnique({
    where: { id: data.productoId }
  });
  
  if (producto?.esProductoIntermedio) {
    await productoIntermedioService.actualizarCostoIngredienteVinculado(data.productoId);
  }
  
  return receta;
}
```

---

## 🎨 Implementación Frontend

### Formulario de Producto (Modificado)

```typescript
// frontend/src/app/dashboard/inventario/producto/page.tsx

const [formData, setFormData] = useState({
  // ... campos existentes ...
  esProductoIntermedio: false,
  rendimiento: 0,
  unidadRendimiento: 'KILOGRAMO'
});

// En el formulario, agregar:
<FormControlLabel
  control={
    <Checkbox
      checked={formData.esProductoIntermedio}
      onChange={(e) => setFormData({
        ...formData,
        esProductoIntermedio: e.target.checked
      })}
    />
  }
  label="Este producto también es un ingrediente"
/>

{formData.esProductoIntermedio && (
  <>
    <TextField
      label="Rendimiento"
      type="number"
      value={formData.rendimiento}
      onChange={(e) => setFormData({
        ...formData,
        rendimiento: Number(e.target.value)
      })}
      helperText="Cantidad que produce este producto"
    />
    
    <TextField
      select
      label="Unidad de Rendimiento"
      value={formData.unidadRendimiento}
      onChange={(e) => setFormData({
        ...formData,
        unidadRendimiento: e.target.value
      })}
    >
      {UNIDADES_MEDIDA.map((u) => (
        <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
      ))}
    </TextField>
  </>
)}
```

### Indicador Visual

```typescript
// En la lista de ingredientes, mostrar si viene de un producto
{ingrediente.productoVinculadoId && (
  <Chip
    icon={<LinkIcon />}
    label="Producto Intermedio"
    size="small"
    color="info"
  />
)}
```

---

## 📊 Ejemplo Completo: Mayonesa Casera

### Paso 1: Crear Producto Mayonesa

```
Nombre: Mayonesa Casera
Es Producto Intermedio: ✅ Sí
Rendimiento: 1000
Unidad Rendimiento: Mililitro
Precio: $500 (si se vende sola)
```

### Paso 2: Agregar Receta

```
Ingredientes:
- Huevo: 4 unidades × $50 = $200
- Aceite: 400 ml × $1.50 = $600
- Limón: 100 ml × $1 = $100
Costo Total: $900
```

### Paso 3: Sistema Auto-Crea Ingrediente

```
Ingrediente: Mayonesa Casera
Costo: $0.90/ml ($900 ÷ 1000 ml)
Unidad: Mililitro
Producto Vinculado: [ID Mayonesa]
```

### Paso 4: Usar en Hamburguesa

```
Producto: Hamburguesa Completa
Receta:
- Pan: 1 unidad = $200
- Carne: 150 g = $750
- Mayonesa Casera: 50 ml = $45  ← Usa el ingrediente auto-creado
Costo Total: $995
```

### Paso 5: Cambio en Receta de Mayonesa

```
Cambio: Aceite más caro
Nuevo costo Mayonesa: $1,200
Nuevo costo/ml: $1.20

Sistema automáticamente:
1. Actualiza ingrediente: $1.20/ml
2. Recalcula Hamburguesa: $995 → $1,010
```

---

## 🎯 Beneficios

### Para el Usuario
- ✅ **Un solo lugar**: Receta de mayonesa en un solo producto
- ✅ **Actualización automática**: Cambias la receta, se actualiza todo
- ✅ **Menos trabajo**: No duplicar información
- ✅ **Más preciso**: Costo siempre sincronizado

### Para el Sistema
- ✅ **Trazabilidad**: Sabes de dónde viene cada ingrediente
- ✅ **Consistencia**: Un solo origen de verdad
- ✅ **Escalable**: Productos intermedios de productos intermedios
- ✅ **Flexible**: Puedes vender el producto o usarlo como ingrediente

---

## 🚀 Próximos Pasos

1. ✅ **Migración de BD** - Agregar campos nuevos
2. ⏳ **Servicio Backend** - Crear ProductoIntermedioService
3. ⏳ **Actualizar Controladores** - Manejar nuevos campos
4. ⏳ **UI Frontend** - Checkbox y campos de rendimiento
5. ⏳ **Auto-sincronización** - Actualizar costos en cascada
6. ⏳ **Indicadores visuales** - Mostrar productos vinculados
7. ⏳ **Testing** - Probar flujo completo

---

## 📝 Migración SQL

```sql
-- Agregar campos a productos
ALTER TABLE productos 
ADD COLUMN es_producto_intermedio BOOLEAN DEFAULT FALSE,
ADD COLUMN rendimiento DECIMAL(10,3),
ADD COLUMN unidad_rendimiento VARCHAR(20);

-- Agregar índice
CREATE INDEX idx_productos_intermedio ON productos(tenant_id, es_producto_intermedio);

-- Agregar campo a ingredientes
ALTER TABLE ingredientes
ADD COLUMN producto_vinculado_id VARCHAR(36) UNIQUE;

-- Agregar foreign key
ALTER TABLE ingredientes
ADD CONSTRAINT fk_ingrediente_producto
FOREIGN KEY (producto_vinculado_id)
REFERENCES productos(id)
ON DELETE SET NULL;

-- Agregar índice
CREATE INDEX idx_ingrediente_producto ON ingredientes(producto_vinculado_id);
```

---

**Fecha**: Diciembre 2024  
**Estado**: 🔄 En Implementación  
**Prioridad**: Alta
