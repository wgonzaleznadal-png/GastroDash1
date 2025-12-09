# 🧪 Sistema de Ingredientes y Recetas

## ✅ Progreso Actual

### Completado
- ✅ Modelos de Prisma creados
- ✅ Migración de base de datos aplicada
- ✅ Enum `UnidadMedida` definido

---

## 📊 Modelos Creados

### 1. Ingrediente
```prisma
model Ingrediente {
  id          String       @id @default(uuid())
  tenantId    String
  
  nombre      String
  descripcion String?
  costo       Decimal      // Costo por unidad
  unidad      UnidadMedida // KILOGRAMO, GRAMO, LITRO, etc.
  stockActual Decimal
  stockMinimo Decimal
  activo      Boolean
  
  recetas     Receta[]     // Productos que usan este ingrediente
}
```

### 2. Receta
```prisma
model Receta {
  id            String
  productoId    String
  ingredienteId String
  
  cantidad      Decimal      // Cantidad del ingrediente
  unidad        UnidadMedida // Unidad de medida
  
  producto      Producto
  ingrediente   Ingrediente
}
```

### 3. Unidades de Medida
```prisma
enum UnidadMedida {
  KILOGRAMO
  GRAMO
  LITRO
  MILILITRO
  UNIDAD
  PORCION
}
```

---

## 🎯 Funcionalidad Planificada

### Gestión de Ingredientes
1. **CRUD de Ingredientes**
   - Crear ingrediente con costo y unidad
   - Editar ingrediente
   - Eliminar ingrediente
   - Listar ingredientes

2. **Control de Stock**
   - Stock actual
   - Stock mínimo
   - Alertas de stock bajo

### Gestión de Recetas
1. **Asignar Ingredientes a Productos**
   - Agregar ingredientes a un producto
   - Especificar cantidad y unidad
   - Eliminar ingredientes de receta

2. **Cálculo Automático de Costo**
   - Sumar costo de todos los ingredientes
   - Convertir unidades si es necesario
   - Actualizar costo del producto

---

## 💰 Ejemplo de Cálculo

### Producto: Pizza Muzzarella

**Ingredientes:**
1. Harina - 0.5 kg × $500/kg = $250
2. Queso - 0.3 kg × $2,000/kg = $600
3. Salsa - 0.2 kg × $800/kg = $160
4. Aceitunas - 100 g × $3,000/kg = $300

**Costo Total de la Receta: $1,310**

**Precio de Venta:**
- Costo: $1,310
- Impuestos (21%): $275
- Beneficio (40%): $524
- **Precio Final: $2,109**

---

## 🔄 Flujo de Trabajo

### 1. Crear Ingredientes
```
Ingrediente: Harina
├─ Costo: $500
├─ Unidad: KILOGRAMO
├─ Stock: 50 kg
└─ Stock Mínimo: 10 kg
```

### 2. Crear Producto
```
Producto: Pizza Muzzarella
└─ Categoría: Platos Principales
```

### 3. Agregar Receta
```
Pizza Muzzarella
├─ Harina: 0.5 kg
├─ Queso: 0.3 kg
├─ Salsa: 0.2 kg
└─ Aceitunas: 100 g
```

### 4. Cálculo Automático
```
Sistema calcula:
├─ Costo Total: $1,310
├─ Aplica porcentajes
└─ Precio Final: $2,109
```

---

## 📋 Archivos a Crear

### Backend
- [x] `prisma/schema.prisma` - Modelos
- [ ] `services/ingrediente.service.ts` - Lógica de ingredientes
- [ ] `services/receta.service.ts` - Lógica de recetas
- [ ] `controllers/ingrediente.controller.ts` - Endpoints
- [ ] `routes/ingrediente.routes.ts` - Rutas
- [ ] Actualizar `producto.service.ts` - Cálculo de costo

### Frontend
- [ ] `services/ingrediente.service.ts` - Cliente API
- [ ] `app/dashboard/ingredientes/page.tsx` - UI de ingredientes
- [ ] Actualizar `app/dashboard/inventario/page.tsx` - Agregar recetas

---

## 🎨 UI Planificada

### Página de Ingredientes
```
┌─────────────────────────────────────────────────┐
│ Ingredientes                    [+ Nuevo]       │
├─────────────────────────────────────────────────┤
│ Buscar: [____________]                          │
├─────────────────────────────────────────────────┤
│ Nombre      │ Costo   │ Unidad │ Stock │ Acciones│
│ Harina      │ $500    │ kg     │ 50    │ ✏️ 🗑️  │
│ Queso       │ $2,000  │ kg     │ 20    │ ✏️ 🗑️  │
│ Salsa       │ $800    │ kg     │ 15    │ ✏️ 🗑️  │
└─────────────────────────────────────────────────┘
```

### Formulario de Producto (Actualizado)
```
┌─────────────────────────────────────────────────┐
│ Editar Producto: Pizza Muzzarella              │
├─────────────────────────────────────────────────┤
│ Nombre: [Pizza Muzzarella]                     │
│ Categoría: [Platos Principales ▼]              │
│                                                 │
│ ┌─ Receta (Ingredientes) ─────────────────┐   │
│ │ [+ Agregar Ingrediente]                  │   │
│ │                                           │   │
│ │ Ingrediente    │ Cantidad │ Unidad │ 🗑️ │   │
│ │ Harina         │ 0.5      │ kg     │ ❌ │   │
│ │ Queso          │ 0.3      │ kg     │ ❌ │   │
│ │ Salsa          │ 0.2      │ kg     │ ❌ │   │
│ │                                           │   │
│ │ Costo Total: $1,310                      │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ Precio Venta: $2,109 (calculado)               │
│                                                 │
│ [Cancelar]  [Guardar]                          │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Próximos Pasos

1. ⏳ Crear servicios de backend
2. ⏳ Crear controladores y rutas
3. ⏳ Crear UI de ingredientes
4. ⏳ Integrar recetas en productos
5. ⏳ Implementar cálculo automático

---

**Estado**: En progreso (30% completado)  
**Base de datos**: ✅ Lista  
**Backend**: ⏳ En desarrollo  
**Frontend**: ⏳ Pendiente  
**Fecha**: Diciembre 2024
