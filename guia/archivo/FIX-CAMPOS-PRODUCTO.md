# 🔧 FIX: Campos Desconocidos en Producto

## ❌ Problema

Error 500 al crear productos:
```
Unknown argument `porcentajeImpuestos`. Available options are marked with ?.
```

---

## 🔍 Causa Raíz

El frontend enviaba campos que **NO existen** en el modelo Prisma:

### Campos Enviados por Frontend
```typescript
{
  categoriaId: "...",
  nombre: "Arroz con Pollo",
  precio: 304,
  costo: 188.71,
  porcentajeImpuestos: 21,      // ❌ No existe en BD
  porcentajeBeneficio: 30,      // ❌ No existe en BD
  porcentajeOtros: 10,          // ❌ No existe en BD
  calcularPrecioAutomatico: false, // ❌ No existe en BD
  stock: 10,
  stockMinimo: 1,
  disponible: true
}
```

### Modelo Prisma Real
```prisma
model Producto {
  id          String     @id @default(uuid())
  tenantId    String
  categoriaId String?
  nombre      String
  descripcion String?
  precio      Decimal    @db.Decimal(10, 2)
  costo       Decimal?   @db.Decimal(10, 2)
  stock       Int        @default(0)
  stockMinimo Int        @default(0)
  disponible  Boolean    @default(true)
  // ❌ NO tiene porcentajes ni calcularPrecioAutomatico
}
```

---

## ✅ Solución

Filtrar los campos antes de enviar a Prisma.

### Método `createProducto`

```typescript
// ✅ ANTES - Pasaba todos los campos
return await this.create(tenantId, {
  ...data,  // ❌ Incluye campos que no existen
  precio: precioFinal,
  disponible: data.disponible ?? true,
});

// ✅ AHORA - Solo campos válidos
const productoData = {
  categoriaId: data.categoriaId,
  nombre: data.nombre,
  descripcion: data.descripcion,
  precio: precioFinal,
  costo: data.costo,
  stock: data.stock,
  stockMinimo: data.stockMinimo,
  disponible: data.disponible ?? true,
};

return await this.create(tenantId, productoData);
```

### Método `updateProducto`

```typescript
// ✅ ANTES - Destructuring incompleto
const { categoriaId, calcularPrecioAutomatico, ... } = data;

// ✅ AHORA - Filtrado explícito
const updateData: any = {};
if (data.nombre !== undefined) updateData.nombre = data.nombre;
if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
if (precioFinal !== undefined) updateData.precio = precioFinal;
if (data.costo !== undefined) updateData.costo = data.costo;
if (data.stock !== undefined) updateData.stock = data.stock;
if (data.stockMinimo !== undefined) updateData.stockMinimo = data.stockMinimo;
if (data.disponible !== undefined) updateData.disponible = data.disponible;
if (data.categoriaId !== undefined) updateData.categoriaId = data.categoriaId;

return await prisma.producto.update({
  where: { id },
  data: updateData,
});
```

---

## 🎯 ¿Qué Hacemos con los Porcentajes?

Los porcentajes (`porcentajeImpuestos`, `porcentajeBeneficio`, `porcentajeOtros`) se usan para **calcular el precio** pero **NO se guardan** en la base de datos.

### Flujo:

1. **Frontend envía:**
   ```json
   {
     "costo": 1000,
     "porcentajeImpuestos": 21,
     "porcentajeBeneficio": 40,
     "porcentajeOtros": 5,
     "calcularPrecioAutomatico": true
   }
   ```

2. **Backend calcula:**
   ```typescript
   const impuestos = 1000 * 0.21 = 210
   const beneficio = 1000 * 0.40 = 400
   const otros = 1000 * 0.05 = 50
   const precioFinal = 1000 + 210 + 400 + 50 = 1660
   ```

3. **Backend guarda:**
   ```json
   {
     "costo": 1000,
     "precio": 1660
   }
   ```

**Los porcentajes NO se guardan, solo se usan para el cálculo.**

---

## 📊 Campos del Modelo Producto

### Campos Guardados en BD

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (UUID) | ID único |
| `tenantId` | String (UUID) | ID del tenant |
| `categoriaId` | String (UUID) | ID de categoría |
| `nombre` | String | Nombre del producto |
| `descripcion` | String? | Descripción opcional |
| `precio` | Decimal | Precio de venta |
| `costo` | Decimal? | Costo del producto |
| `stock` | Int | Stock actual |
| `stockMinimo` | Int | Stock mínimo |
| `disponible` | Boolean | Si está disponible |

### Campos Solo para Cálculo (No se guardan)

| Campo | Tipo | Uso |
|-------|------|-----|
| `porcentajeImpuestos` | Number | Calcular precio |
| `porcentajeBeneficio` | Number | Calcular precio |
| `porcentajeOtros` | Number | Calcular precio |
| `calcularPrecioAutomatico` | Boolean | Flag para calcular |

---

## 🧪 Prueba

### Crear Producto con Cálculo Automático

```bash
curl -X POST http://localhost:3001/api/productos \
  -H "Authorization: Bearer tu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "categoriaId": "uuid-valido",
    "nombre": "Arroz con Pollo",
    "descripcion": "550 gr de Arroz a la Valenciana",
    "costo": 1000,
    "porcentajeImpuestos": 21,
    "porcentajeBeneficio": 40,
    "porcentajeOtros": 5,
    "calcularPrecioAutomatico": true,
    "stock": 10,
    "stockMinimo": 1
  }'
```

**Respuesta esperada:**
```json
{
  "id": "...",
  "nombre": "Arroz con Pollo",
  "costo": 1000,
  "precio": 1660,  // ← Calculado automáticamente
  "stock": 10,
  "stockMinimo": 1,
  "disponible": true
}
```

---

## ✅ Resultado

**El error está corregido!**

- ✅ Solo se envían campos válidos a Prisma
- ✅ Los porcentajes se usan para calcular el precio
- ✅ El precio calculado se guarda correctamente
- ✅ No más errores de "Unknown argument"

**El sistema ahora funciona correctamente!** 🚀

---

**Fecha**: Diciembre 2024  
**Estado**: ✅ Resuelto  
**Archivos Modificados**: 
- `/backend/src/services/producto.service.ts`
- `/backend/src/controllers/producto.controller.ts`
