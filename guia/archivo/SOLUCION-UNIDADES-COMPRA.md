# ✅ SOLUCIÓN: UNIDADES DE COMPRA (MAPLE DE HUEVOS)

## 🎯 PROBLEMA RESUELTO

**Situación:** Compras ingredientes en una unidad pero usas otra en las recetas.

**Ejemplo:** 
- Compras: **Maple de 30 huevos** por $900
- Usas: **1 huevo** en la hamburguesa
- Necesitas: Calcular que 1 huevo = $30

---

## 💡 SOLUCIÓN IMPLEMENTADA

Agregamos el campo **"Cantidad por Unidad"** que divide automáticamente el costo.

### Cómo Funciona

```
Ingrediente: Huevos
Costo: $900
Unidad: UNIDAD
Cantidad por Unidad: 30

Costo por huevo = $900 / 30 = $30

Receta Hamburguesa:
- Huevos: 1 UNIDAD
- Costo: $30 ✅
```

---

## 📋 CASOS DE USO

### 1. Huevos (Maple)
```
Compra:
- Maple de 30 huevos: $900
- Unidad: UNIDAD
- Cantidad por Unidad: 30

Uso en receta:
- 1 huevo = $900 / 30 = $30
- 2 huevos = $900 / 30 × 2 = $60
```

### 2. Paquete de Salchichas
```
Compra:
- Paquete de 12 salchichas: $600
- Unidad: UNIDAD
- Cantidad por Unidad: 12

Uso en receta:
- 2 salchichas = $600 / 12 × 2 = $100
```

### 3. Caja de Tomates
```
Compra:
- Caja de 20 tomates: $1,000
- Unidad: UNIDAD
- Cantidad por Unidad: 20

Uso en receta:
- 3 tomates = $1,000 / 20 × 3 = $150
```

---

## 🛠️ IMPLEMENTACIÓN

### 1. Base de Datos

**Archivo:** `/backend/prisma/schema.prisma`

```prisma
model Ingrediente {
  // ... otros campos
  costo             Decimal      @db.Decimal(10, 2)
  unidad            UnidadMedida
  cantidadPorUnidad Decimal?     @db.Decimal(10, 3) // ← NUEVO
  // ... otros campos
}
```

**Migración aplicada:**
```
✅ 20241201223126_add_cantidad_por_unidad_to_ingredientes
```

---

### 2. Backend - Cálculo de Costo

**Archivo:** `/backend/src/services/receta.service.ts`

```typescript
async calcularCostoReceta(productoId: string): Promise<number> {
  const recetas = await this.getRecetasByProducto(productoId);
  let costoTotal = 0;

  for (const receta of recetas) {
    const costoIngrediente = Number(receta.ingrediente.costo);
    const cantidad = Number(receta.cantidad);
    const cantidadPorUnidad = Number(receta.ingrediente.cantidadPorUnidad) || 1;

    // Si tiene cantidadPorUnidad (ej: 30 huevos por maple)
    if (receta.unidad === 'UNIDAD' && 
        receta.ingrediente.unidad === 'UNIDAD' && 
        cantidadPorUnidad > 1) {
      const costoPorUnidadIndividual = costoIngrediente / cantidadPorUnidad;
      costoTotal += costoPorUnidadIndividual * cantidad;
      continue;
    }

    // ... conversiones de unidades normales
  }

  return Math.round(costoTotal);
}
```

---

### 3. Frontend - Formulario de Ingredientes

**Archivo:** `/frontend/src/app/dashboard/ingredientes/ingrediente/page.tsx`

**Campo agregado:**
```typescript
<TextField
  fullWidth
  label="Cantidad por Unidad"
  type="number"
  value={formData.cantidadPorUnidad || ''}
  onChange={(e) => setFormData({ 
    ...formData, 
    cantidadPorUnidad: Number(e.target.value) || undefined 
  })}
  helperText={formData.unidad === 'UNIDAD' ? "Ej: 30 huevos por maple" : "Solo para UNIDAD"}
  disabled={formData.unidad !== 'UNIDAD'}
/>
```

**Características:**
- ✅ Solo se habilita cuando Unidad = UNIDAD
- ✅ Helper text con ejemplo
- ✅ Opcional (puede dejarse vacío)

---

### 4. Frontend - Cálculo en Recetas

**Archivo:** `/frontend/src/app/dashboard/inventario/producto/page.tsx`

```typescript
const calcularCostoReceta = () => {
  return Math.round(recetas.reduce((sum, r) => {
    const costoIng = Number(r.ingrediente.costo);
    const cant = Number(r.cantidad);
    const cantidadPorUnidad = Number(r.ingrediente.cantidadPorUnidad) || 1;
    
    // Si tiene cantidadPorUnidad
    if (r.unidad === 'UNIDAD' && 
        r.ingrediente.unidad === 'UNIDAD' && 
        cantidadPorUnidad > 1) {
      return sum + (costoIng / cantidadPorUnidad) * cant;
    }
    
    // ... conversiones normales
  }, 0));
};
```

---

## 📊 EJEMPLO COMPLETO

### Crear Ingrediente: Huevos

```
1. Ingredientes → Nuevo Ingrediente

2. Llenar formulario:
   - Nombre: Huevos
   - Descripción: Maple de 30 huevos
   - Costo: $900
   - Unidad: UNIDAD
   - Cantidad por Unidad: 30  ← NUEVO CAMPO
   - Estado: Activo

3. Guardar

Resultado:
✅ Ingrediente creado
✅ Costo por huevo: $900 / 30 = $30
```

### Usar en Receta: Hamburguesa

```
1. Productos → Nuevo Producto → Hamburguesa

2. Agregar a Receta:
   - Ingrediente: Huevos
   - Cantidad: 1
   - Unidad: Unidad

3. Cálculo automático:
   - Costo: $900 / 30 × 1 = $30 ✅

4. Si usas 2 huevos:
   - Costo: $900 / 30 × 2 = $60 ✅
```

---

## 🎯 VENTAJAS

### Precisión
- ✅ **Cálculo exacto** del costo por unidad
- ✅ **Sin cálculos manuales** externos
- ✅ **Actualización automática** si cambia el precio

### Flexibilidad
- ✅ **Funciona con cualquier cantidad**
- ✅ **Opcional** (solo para UNIDAD)
- ✅ **Compatible** con otras unidades

### Facilidad
- ✅ **Un solo campo** extra
- ✅ **Helper text** explicativo
- ✅ **Se deshabilita** cuando no aplica

---

## 🔧 ARCHIVOS MODIFICADOS

### Backend
1. ✅ `/backend/prisma/schema.prisma` - Campo `cantidadPorUnidad`
2. ✅ `/backend/src/services/receta.service.ts` - Lógica de cálculo

### Frontend
3. ✅ `/frontend/src/services/ingrediente.service.ts` - Interfaces
4. ✅ `/frontend/src/app/dashboard/ingredientes/ingrediente/page.tsx` - Formulario
5. ✅ `/frontend/src/app/dashboard/inventario/producto/page.tsx` - Cálculos

---

## ✅ CHECKLIST

### Base de Datos
- [x] Campo `cantidadPorUnidad` agregado
- [x] Migración aplicada
- [x] Tipo Decimal(10, 3)
- [x] Opcional (nullable)

### Backend
- [x] Lógica de cálculo implementada
- [x] División automática del costo
- [x] Compatible con conversiones existentes

### Frontend - Ingredientes
- [x] Campo en formulario
- [x] Solo habilitado para UNIDAD
- [x] Helper text explicativo
- [x] Carga de datos al editar

### Frontend - Productos
- [x] Cálculo en función calcularCostoReceta
- [x] Cálculo en tabla de recetas
- [x] Cálculo en suma total
- [x] Precio sugerido actualizado

---

## 🎊 RESULTADO FINAL

```
┌─────────────────────────────────────────┐
│   UNIDADES DE COMPRA IMPLEMENTADAS      │
│                                         │
│  ✅ Campo "Cantidad por Unidad"          │
│  ✅ Cálculo automático de costo          │
│  ✅ Maple de 30 huevos → $30 por huevo   │
│  ✅ Paquete de 12 → costo individual     │
│  ✅ Sin cálculos manuales externos       │
│  ✅ Actualización automática             │
│  ✅ Compatible con todo el sistema       │
└─────────────────────────────────────────┘
```

---

## 🚀 PRUEBA AHORA

### Paso 1: Crear Ingrediente

```
1. Recarga navegador (Cmd+R)
2. Ingredientes → Nuevo Ingrediente
3. Llenar:
   - Nombre: Huevos
   - Costo: $900
   - Unidad: UNIDAD
   - Cantidad por Unidad: 30
4. Guardar
```

### Paso 2: Usar en Receta

```
1. Productos → Nuevo Producto
2. Nombre: Hamburguesa
3. Agregar Receta:
   - Ingrediente: Huevos
   - Cantidad: 1
   - Unidad: Unidad
4. Verificar:
   ✅ Costo Total: $30 (no $900)
```

### Paso 3: Verificar Cálculo

```
Cambiar cantidad a 2 huevos:
✅ Costo Total: $60

Cambiar cantidad a 5 huevos:
✅ Costo Total: $150

Fórmula: $900 / 30 × cantidad
```

---

## 💡 OTROS EJEMPLOS

### Paquete de Queso
```
Costo: $1,200 (paquete de 8 porciones)
Unidad: UNIDAD
Cantidad por Unidad: 8

Uso: 2 porciones = $1,200 / 8 × 2 = $300
```

### Bandeja de Carne
```
Costo: $3,000 (bandeja de 10 hamburguesas)
Unidad: UNIDAD
Cantidad por Unidad: 10

Uso: 1 hamburguesa = $3,000 / 10 = $300
```

### Caja de Bebidas
```
Costo: $600 (caja de 24 latas)
Unidad: UNIDAD
Cantidad por Unidad: 24

Uso: 1 lata = $600 / 24 = $25
```

---

**¡Solución práctica y automática para unidades de compra!** 🎉

**Fecha**: 1 de Diciembre, 2024  
**Estado**: ✅ Implementado  
**Funcionalidad**: Cantidad por Unidad  
**Impacto**: Alto - Facilita gestión de costos
