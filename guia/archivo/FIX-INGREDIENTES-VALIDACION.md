# 🔧 Fix: Error 500 en Ingredientes

## ❌ Error Original

```
GET /api/ingredientes - 500 Internal Server Error

ZodError: Number must be greater than or equal to 0
Path: stockMinimo
```

## 🔍 Causa del Problema

El schema de validación de Zod requería que `stockActual` y `stockMinimo` fueran números, pero cuando estos campos no se enviaban en el request, llegaban como `undefined`, causando un error de validación.

## ✅ Solución Aplicada

### Antes (Incorrecto)
```typescript
const createIngredienteSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  costo: z.number().positive(),
  unidad: z.enum(['KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'PORCION']),
  stockActual: z.number().min(0).optional(),    // ❌ Sin default
  stockMinimo: z.number().min(0).optional(),    // ❌ Sin default
  activo: z.boolean().optional(),               // ❌ Sin default
});
```

### Después (Correcto)
```typescript
const createIngredienteSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().optional(),
  costo: z.number().positive(),
  unidad: z.enum(['KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'UNIDAD', 'PORCION']),
  stockActual: z.number().min(0).optional().default(0),    // ✅ Con default
  stockMinimo: z.number().min(0).optional().default(0),    // ✅ Con default
  activo: z.boolean().optional().default(true),            // ✅ Con default
});
```

## 🎯 Cambios Realizados

1. **Agregado `.default(0)` a `stockActual`**
   - Si no se envía, usa 0 por defecto

2. **Agregado `.default(0)` a `stockMinimo`**
   - Si no se envía, usa 0 por defecto

3. **Agregado `.default(true)` a `activo`**
   - Si no se envía, el ingrediente está activo por defecto

## 📋 Archivo Modificado

- `backend/src/controllers/ingrediente.controller.ts` (líneas 10-12)

## ✅ Resultado

**Antes:**
```
POST /api/ingredientes
{
  "nombre": "Harina",
  "costo": 500,
  "unidad": "KILOGRAMO"
}
❌ 500 Error - stockMinimo required
```

**Después:**
```
POST /api/ingredientes
{
  "nombre": "Harina",
  "costo": 500,
  "unidad": "KILOGRAMO"
}
✅ 201 Created
{
  "id": "...",
  "nombre": "Harina",
  "costo": 500,
  "unidad": "KILOGRAMO",
  "stockActual": 0,      // ✅ Default aplicado
  "stockMinimo": 0,      // ✅ Default aplicado
  "activo": true         // ✅ Default aplicado
}
```

## 🧪 Prueba

Ahora puedes crear ingredientes sin especificar stock:

```bash
curl -X POST http://localhost:3001/api/ingredientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre": "Harina",
    "costo": 500,
    "unidad": "KILOGRAMO"
  }'
```

O con stock:

```bash
curl -X POST http://localhost:3001/api/ingredientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre": "Queso",
    "costo": 2000,
    "unidad": "KILOGRAMO",
    "stockActual": 50,
    "stockMinimo": 10
  }'
```

Ambos funcionarán correctamente.

---

**Estado**: ✅ Corregido  
**Backend**: ✅ Reiniciado y funcionando  
**Fecha**: Diciembre 2024
