# 🔧 Fix: Error al Actualizar Productos

## ❌ Error Original

```
PUT /api/productos/:id - 500 Internal Server Error

Unknown argument `categoriaId`. Did you mean `categoria`?
```

## 🔍 Causa del Problema

Prisma no acepta `categoriaId` directamente en operaciones de `update`. Debe usar la relación `categoria` con `connect`.

Además, los campos de cálculo de precio (`porcentajeImpuestos`, `porcentajeBeneficio`, `porcentajeOtros`, `calcularPrecioAutomatico`) no existen en el modelo de Prisma, por lo que causaban errores al intentar guardarlos.

## ✅ Solución Implementada

### Antes (Incorrecto)
```typescript
async updateProducto(tenantId: string, id: string, data: UpdateProductoDTO) {
  const updateData = { ...data };
  if (data.calcularPrecioAutomatico && data.costo) {
    updateData.precio = this.calcularPrecioVenta(...);
  }
  
  // ❌ Esto falla porque categoriaId no es un campo directo
  return await this.update(tenantId, id, updateData);
}
```

### Después (Correcto)
```typescript
async updateProducto(tenantId: string, id: string, data: UpdateProductoDTO) {
  // Calcular precio si es necesario
  let precioFinal = data.precio;
  if (data.calcularPrecioAutomatico && data.costo) {
    precioFinal = this.calcularPrecioVenta(...);
  }

  // ✅ Remover campos que no son del modelo
  const { 
    categoriaId, 
    calcularPrecioAutomatico, 
    porcentajeImpuestos, 
    porcentajeBeneficio, 
    porcentajeOtros, 
    ...updateData 
  } = data;

  // ✅ Usar Prisma directamente con la relación correcta
  return await prisma.producto.update({
    where: { id },
    data: {
      ...updateData,
      ...(precioFinal !== undefined && { precio: precioFinal }),
      ...(categoriaId && {
        categoria: {
          connect: { id: categoriaId }  // ✅ Forma correcta
        }
      }),
    },
  });
}
```

## 🎯 Cambios Clave

### 1. Destructuring de Campos No-Modelo
```typescript
const { 
  categoriaId,           // Campo de relación
  calcularPrecioAutomatico,  // Campo temporal
  porcentajeImpuestos,       // Campo temporal
  porcentajeBeneficio,       // Campo temporal
  porcentajeOtros,           // Campo temporal
  ...updateData              // Solo campos del modelo
} = data;
```

### 2. Uso Correcto de Relaciones Prisma
```typescript
// ❌ Incorrecto
data: {
  categoriaId: "uuid"
}

// ✅ Correcto
data: {
  categoria: {
    connect: { id: "uuid" }
  }
}
```

### 3. Actualización Condicional
```typescript
...(precioFinal !== undefined && { precio: precioFinal }),
...(categoriaId && {
  categoria: {
    connect: { id: categoriaId }
  }
}),
```

## 📋 Campos del Modelo vs Campos Temporales

### Campos del Modelo (se guardan en DB)
- ✅ `nombre`
- ✅ `descripcion`
- ✅ `precio`
- ✅ `costo`
- ✅ `stock`
- ✅ `stockMinimo`
- ✅ `disponible`
- ✅ `codigoBarras`
- ✅ `imagen`

### Campos Temporales (solo para cálculo)
- ❌ `porcentajeImpuestos` - Solo para calcular precio
- ❌ `porcentajeBeneficio` - Solo para calcular precio
- ❌ `porcentajeOtros` - Solo para calcular precio
- ❌ `calcularPrecioAutomatico` - Flag de control

### Campos de Relación
- 🔗 `categoriaId` - Se convierte a `categoria.connect`

## 🧪 Prueba

### Request
```json
PUT /api/productos/26374b9d-e3b8-48b3-baea-5d47271e23d3

{
  "categoriaId": "633e4645-8b3c-4420-8599-04277dbca2cc",
  "nombre": "Coca Cola 500ml",
  "descripcion": "Gaseosa Coca Cola 500ml",
  "costo": 600,
  "porcentajeImpuestos": 30,
  "porcentajeBeneficio": 10,
  "porcentajeOtros": 1,
  "calcularPrecioAutomatico": true,
  "stock": 100,
  "stockMinimo": 20,
  "disponible": true
}
```

### Proceso Interno
1. ✅ Calcula precio: 600 + (600×30%) + (600×10%) + (600×1%) = 846
2. ✅ Remueve campos temporales
3. ✅ Conecta categoría usando relación
4. ✅ Actualiza producto con precio calculado

### Response
```json
{
  "id": "26374b9d-e3b8-48b3-baea-5d47271e23d3",
  "categoriaId": "633e4645-8b3c-4420-8599-04277dbca2cc",
  "nombre": "Coca Cola 500ml",
  "descripcion": "Gaseosa Coca Cola 500ml",
  "precio": 846,
  "costo": 600,
  "stock": 100,
  "stockMinimo": 20,
  "disponible": true,
  ...
}
```

## ✅ Resultado

**Antes:**
```
❌ PUT /api/productos/:id - 500 Error
```

**Después:**
```
✅ PUT /api/productos/:id - 200 OK
✅ Precio calculado correctamente
✅ Categoría actualizada
✅ Todos los campos guardados
```

## 📝 Notas Importantes

### Por qué no guardamos los porcentajes en DB

Los porcentajes (`porcentajeImpuestos`, `porcentajeBeneficio`, `porcentajeOtros`) son **campos de cálculo temporal**:

1. **No están en el schema de Prisma** - No hay columnas en la DB
2. **Solo se usan para calcular el precio** - Una vez calculado, no se necesitan
3. **El precio final es lo que importa** - Es lo que se usa en ventas

Si quisieras guardar los porcentajes para referencia futura, necesitarías:
1. Agregar los campos al schema de Prisma
2. Ejecutar una migración
3. Actualizar el código para guardarlos

## 🎯 Lecciones Aprendidas

1. **Relaciones en Prisma** - Usar `connect` para relaciones
2. **Campos temporales** - Removerlos antes de guardar
3. **Destructuring** - Separar campos del modelo de campos auxiliares
4. **Validación previa** - Verificar que la categoría existe antes de conectar

---

**Estado**: ✅ Corregido y funcionando  
**Archivo**: `backend/src/services/producto.service.ts`  
**Fecha**: Diciembre 2024
