# ✅ ACTUALIZACIÓN AUTOMÁTICA DE COSTOS

## 🎯 FUNCIONALIDAD IMPLEMENTADA

El sistema ahora actualiza **automáticamente el costo de los productos** cuando:
- Modificas el precio de un ingrediente
- Agregas un ingrediente a una receta
- Modificas la cantidad de un ingrediente en una receta
- Eliminas un ingrediente de una receta

**El precio de venta final NO se modifica automáticamente** - solo se actualiza manualmente.

---

## 🔄 FLUJO AUTOMÁTICO

### Escenario 1: Modificar Precio de Ingrediente

```
1. Tienes un producto "Hamburguesa" con receta:
   - Pan: $50
   - Carne: $200
   - Lechuga: $30
   Costo total: $280

2. Modificas el precio de la Carne: $200 → $250

3. ✅ AUTOMÁTICAMENTE:
   - Sistema detecta el cambio
   - Recalcula costo de "Hamburguesa"
   - Nuevo costo: $330
   - Precio de venta: NO CAMBIA (manual)
```

### Escenario 2: Agregar Ingrediente a Receta

```
1. Producto "Pizza" con receta:
   - Masa: $100
   - Queso: $150
   Costo total: $250

2. Agregas Tomate: $50 a la receta

3. ✅ AUTOMÁTICAMENTE:
   - Sistema recalcula costo
   - Nuevo costo: $300
   - Precio de venta: NO CAMBIA
```

### Escenario 3: Modificar Cantidad en Receta

```
1. Producto "Ensalada" con receta:
   - Lechuga: 100g ($20)
   - Tomate: 50g ($15)
   Costo total: $35

2. Cambias Lechuga: 100g → 200g

3. ✅ AUTOMÁTICAMENTE:
   - Sistema recalcula costo
   - Nuevo costo: $55
   - Precio de venta: NO CAMBIA
```

### Escenario 4: Eliminar Ingrediente de Receta

```
1. Producto "Sandwich" con receta:
   - Pan: $50
   - Jamón: $100
   - Queso: $80
   Costo total: $230

2. Eliminas el Queso

3. ✅ AUTOMÁTICAMENTE:
   - Sistema recalcula costo
   - Nuevo costo: $150
   - Precio de venta: NO CAMBIA
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### 1. Actualización al Modificar Ingrediente

**Archivo:** `/backend/src/services/ingrediente.service.ts`

```typescript
async updateIngrediente(tenantId: string, id: string, data: UpdateIngredienteDTO) {
  const updated = await this.update(tenantId, id, data);

  // Si se actualizó el costo, recalcular costos de productos relacionados
  if (data.costo !== undefined) {
    await this.actualizarCostosProductosRelacionados(id);
  }

  return updated;
}

async actualizarCostosProductosRelacionados(ingredienteId: string) {
  // Obtener todos los productos que usan este ingrediente
  const recetas = await prisma.receta.findMany({
    where: { ingredienteId },
    select: { productoId: true },
    distinct: ['productoId'],
  });

  // Actualizar el costo de cada producto
  for (const receta of recetas) {
    await recetaService.updateCostoProducto(receta.productoId);
  }
}
```

---

### 2. Actualización al Agregar Ingrediente a Receta

**Archivo:** `/backend/src/services/receta.service.ts`

```typescript
async addIngredienteToProducto(tenantId: string, data: CreateRecetaDTO) {
  const receta = await prisma.receta.create({
    data: {
      productoId: data.productoId,
      ingredienteId: data.ingredienteId,
      cantidad: data.cantidad,
      unidad: data.unidad,
    },
  });

  // Actualizar automáticamente el costo del producto
  await this.updateCostoProducto(data.productoId);

  return receta;
}
```

---

### 3. Actualización al Modificar Cantidad

```typescript
async updateReceta(id: string, data: UpdateRecetaDTO) {
  const receta = await prisma.receta.findUnique({
    where: { id },
    select: { productoId: true },
  });

  const updated = await prisma.receta.update({
    where: { id },
    data,
  });

  // Actualizar automáticamente el costo del producto
  if (receta) {
    await this.updateCostoProducto(receta.productoId);
  }

  return updated;
}
```

---

### 4. Actualización al Eliminar Ingrediente

```typescript
async deleteReceta(id: string) {
  const receta = await prisma.receta.findUnique({
    where: { id },
    select: { productoId: true },
  });

  await prisma.receta.delete({
    where: { id },
  });

  // Actualizar automáticamente el costo del producto
  if (receta) {
    await this.updateCostoProducto(receta.productoId);
  }
}
```

---

### 5. Cálculo de Costo

```typescript
async calcularCostoReceta(productoId: string): Promise<number> {
  const recetas = await this.getRecetasByProducto(productoId);

  let costoTotal = 0;

  for (const receta of recetas) {
    const costoIngrediente = Number(receta.ingrediente.costo);
    const cantidad = Number(receta.cantidad);

    // Conversión de unidades
    let cantidadConvertida = cantidad;

    if (receta.unidad === 'GRAMO' && receta.ingrediente.unidad === 'KILOGRAMO') {
      cantidadConvertida = cantidad / 1000;
    } else if (receta.unidad === 'KILOGRAMO' && receta.ingrediente.unidad === 'GRAMO') {
      cantidadConvertida = cantidad * 1000;
    } else if (receta.unidad === 'MILILITRO' && receta.ingrediente.unidad === 'LITRO') {
      cantidadConvertida = cantidad / 1000;
    } else if (receta.unidad === 'LITRO' && receta.ingrediente.unidad === 'MILILITRO') {
      cantidadConvertida = cantidad * 1000;
    }

    costoTotal += costoIngrediente * cantidadConvertida;
  }

  return Math.round(costoTotal);
}

async updateCostoProducto(productoId: string): Promise<void> {
  const costoCalculado = await this.calcularCostoReceta(productoId);

  await prisma.producto.update({
    where: { id: productoId },
    data: { costo: costoCalculado },
  });
}
```

---

## 💡 VENTAJAS

### Precisión
- ✅ **Costos siempre actualizados** automáticamente
- ✅ **No hay desfases** entre ingredientes y productos
- ✅ **Cálculos precisos** con conversión de unidades
- ✅ **Datos confiables** para toma de decisiones

### Eficiencia
- ✅ **Sin intervención manual** para actualizar costos
- ✅ **Ahorro de tiempo** significativo
- ✅ **Menos errores** humanos
- ✅ **Proceso transparente**

### Control
- ✅ **Precio de venta manual** - tú decides cuándo cambiarlo
- ✅ **Costo automático** - siempre correcto
- ✅ **Margen visible** - costo vs precio
- ✅ **Flexibilidad** en estrategia de precios

---

## 📊 EJEMPLO COMPLETO

### Configuración Inicial

```
Ingredientes:
- Harina: $800/kg
- Azúcar: $500/kg
- Huevo: $50/unidad
- Manteca: $1500/kg

Producto: Torta
Receta:
- Harina: 500g
- Azúcar: 300g
- Huevo: 3 unidades
- Manteca: 200g

Costo calculado:
- Harina: $800 * 0.5kg = $400
- Azúcar: $500 * 0.3kg = $150
- Huevo: $50 * 3 = $150
- Manteca: $1500 * 0.2kg = $300
Total: $1000

Precio de venta: $2500 (manual)
Margen: $1500 (150%)
```

### Cambio de Precio de Ingrediente

```
Modificas Harina: $800 → $1000/kg

✅ AUTOMÁTICAMENTE:
Nuevo costo:
- Harina: $1000 * 0.5kg = $500 (+$100)
- Azúcar: $150
- Huevo: $150
- Manteca: $300
Total: $1100 (+$100)

Precio de venta: $2500 (SIN CAMBIOS)
Margen: $1400 (127%)
```

### Agregar Ingrediente

```
Agregas a la receta:
- Vainilla: $200/unidad, cantidad: 1

✅ AUTOMÁTICAMENTE:
Nuevo costo:
- Harina: $500
- Azúcar: $150
- Huevo: $150
- Manteca: $300
- Vainilla: $200
Total: $1300 (+$200)

Precio de venta: $2500 (SIN CAMBIOS)
Margen: $1200 (92%)
```

---

## 🎯 CASOS DE USO

### 1. Inflación de Ingredientes
```
Problema: Los precios de ingredientes suben
Solución: Actualizas cada ingrediente una vez
Resultado: Todos los productos se recalculan automáticamente
```

### 2. Optimización de Recetas
```
Problema: Quieres reducir costos
Solución: Ajustas cantidades en recetas
Resultado: Ves el impacto inmediato en el costo
```

### 3. Nuevos Proveedores
```
Problema: Cambias de proveedor con nuevos precios
Solución: Actualizas precios de ingredientes
Resultado: Costos de productos se ajustan automáticamente
```

### 4. Análisis de Rentabilidad
```
Problema: Necesitas saber tu margen real
Solución: Costos siempre actualizados
Resultado: Margen = Precio - Costo (siempre correcto)
```

---

## ⚠️ IMPORTANTE

### Precio de Venta
- **NO se modifica automáticamente**
- **Solo cambio manual**
- **Tú decides la estrategia de precios**
- **Puedes mantener precios aunque suban costos**

### Costo
- **SÍ se modifica automáticamente**
- **Siempre refleja costos reales**
- **Basado en receta actual**
- **Incluye conversión de unidades**

---

## ✅ CHECKLIST

### Actualizaciones Automáticas
- [x] Modificar precio de ingrediente → Recalcular productos
- [x] Agregar ingrediente a receta → Recalcular producto
- [x] Modificar cantidad en receta → Recalcular producto
- [x] Eliminar ingrediente de receta → Recalcular producto
- [x] Conversión de unidades en cálculo
- [x] Redondeo de costos

### Precio de Venta
- [x] NO se modifica automáticamente
- [x] Solo cambio manual
- [x] Independiente del costo

---

## 🎊 RESULTADO FINAL

```
┌─────────────────────────────────────────┐
│   ACTUALIZACIÓN AUTOMÁTICA DE COSTOS    │
│                                         │
│  ✅ Modificar ingrediente → Recalcular   │
│  ✅ Agregar a receta → Recalcular        │
│  ✅ Modificar cantidad → Recalcular      │
│  ✅ Eliminar de receta → Recalcular      │
│  ✅ Conversión de unidades               │
│  ✅ Precio de venta: MANUAL              │
│  ✅ Costo: AUTOMÁTICO                    │
│  ✅ Datos siempre actualizados           │
└─────────────────────────────────────────┘
```

---

## 🚀 PRUEBA AHORA

1. **Recarga el navegador** (Cmd+R)
2. **Crea ingredientes:**
   - Pan: $50
   - Carne: $200
3. **Crea producto "Hamburguesa":**
   - Agrega Pan: 1 unidad
   - Agrega Carne: 100g
   - ✅ Costo se calcula: $250
4. **Modifica precio de Carne:**
   - Carne: $200 → $300
   - [Guardar]
5. **Ve al producto "Hamburguesa":**
   - ✅ Costo actualizado: $350
   - Precio de venta: SIN CAMBIOS

**¡El sistema está completamente integrado!** 🎉

---

**Fecha**: 1 de Diciembre, 2024  
**Estado**: ✅ Implementado  
**Funcionalidad**: Actualización Automática de Costos  
**Archivos Modificados**: 2  
**Impacto**: Alto - Sistema completamente integrado
