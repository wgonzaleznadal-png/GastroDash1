# 📖 GUÍA DE USO: PRODUCTOS INTERMEDIOS

## 🎯 ¿Qué son los Productos Intermedios?

Son productos que tienen su propia receta y se usan como ingredientes en otros productos.

### Ejemplos Comunes
- **Mayo Casera** → Se usa en hamburguesas, sandwiches
- **Pan Casero** → Se usa en sandwiches, tostadas
- **Salsa BBQ** → Se usa en costillas, alitas
- **Masa de Pizza** → Se usa en pizzas, calzones

---

## ✅ SISTEMA 100% IMPLEMENTADO Y FUNCIONANDO

### Backend
- ✅ Base de datos actualizada
- ✅ Servicios automáticos funcionando
- ✅ API lista para recibir peticiones

### Frontend
- ✅ Interfaz completa
- ✅ Checkbox y campos agregados
- ✅ Validaciones implementadas
- ✅ Cálculos en tiempo real

---

## 🚀 CÓMO USAR

### Caso 1: Crear Mayo Casera

#### Paso 1: Crear el Producto
1. Ir a **Inventario** → Click en **"Nuevo Producto"**
2. Completar información básica:
   ```
   Nombre: Mayo Casera
   Categoría: Producción Interna
   Descripción: Mayonesa casera para hamburguesas
   Precio: 500 (si la vendes sola)
   Stock: 0
   Stock Mínimo: 0
   ```

#### Paso 2: Marcar como Producto Intermedio
3. Scroll abajo hasta la sección **"🔄 Producto Intermedio"**
4. Marcar el checkbox: **"Este producto también es un ingrediente"**
5. Completar:
   ```
   Rendimiento: 1000
   Unidad de Rendimiento: Mililitro
   ```
   
   💡 **Esto significa:** Este producto produce 1000 ml de mayonesa

#### Paso 3: Agregar la Receta
6. Scroll más abajo hasta **"📝 Receta del Producto"**
7. Agregar ingredientes:
   ```
   - Huevo: 4 unidades
   - Aceite: 400 ml  
   - Limón: 100 ml
   ```
8. El sistema calcula automáticamente:
   ```
   Costo Total: $900
   ```

#### Paso 4: Ver el Cálculo Automático
9. En la sección de Producto Intermedio verás:
   ```
   ✅ Costo por unidad del ingrediente: $0.90 por mililitro
   📝 Este ingrediente estará disponible para usar en otros productos
   ```

#### Paso 5: Guardar
10. Click en **"Crear Producto"**

#### Resultado Automático
```
✅ Producto "Mayo Casera" creado
✅ Ingrediente "Mayo Casera" auto-creado
   - Costo: $0.90/ml
   - Unidad: Mililitro
   - Vinculado al producto
```

---

### Caso 2: Usar Mayo Casera en Hamburguesa

#### Paso 1: Crear Hamburguesa
1. Ir a **Inventario** → **"Nuevo Producto"**
2. Completar:
   ```
   Nombre: Hamburguesa Completa
   Categoría: Platos Principales
   Precio: 2500
   ```

#### Paso 2: Agregar Receta
3. En la sección de **Recetas**, agregar:
   ```
   - Pan: 1 unidad = $200
   - Carne: 150 g = $750
   - Mayo Casera: 50 ml = $45 ← ¡Aquí usas la mayo!
   - Queso: 50 g = $100
   ```

#### Paso 3: Costo Automático
4. El sistema calcula:
   ```
   Costo Total: $1,095
   ```

#### Paso 4: Calcular Precio
5. Agregar porcentajes:
   ```
   Impuestos: 21%
   Beneficio: 40%
   Otros: 5%
   ```
6. Click en **"Calcular Precio Automático"**
7. Precio sugerido: **$1,820**

---

### Caso 3: Cambiar Receta de Mayo (Actualización Automática)

#### Situación
El aceite subió de precio. Necesitas actualizar la receta de la mayo.

#### Paso 1: Editar Mayo Casera
1. Ir a **Inventario**
2. Buscar **"Mayo Casera"**
3. Click en **Editar** (ícono de lápiz)

#### Paso 2: Modificar Receta
4. En la sección de Recetas:
   ```
   Antes: Aceite 400ml × $1.50 = $600
   Ahora: Aceite 400ml × $2.00 = $800
   ```
5. Nuevo costo total: **$1,100**

#### Paso 3: Guardar
6. Click en **"Guardar"**

#### Resultado Automático
```
✅ Producto Mayo Casera actualizado
   Nuevo costo: $1,100

✅ Ingrediente Mayo Casera actualizado
   Nuevo costo: $1.10/ml (antes $0.90/ml)

✅ Hamburguesa Completa actualizada
   Nuevo costo: $1,105 (antes $1,095)
   Mayo: 50ml × $1.10 = $55 (antes $45)

✅ Todos los productos que usan Mayo actualizados
```

---

## 💡 VENTAJAS DEL SISTEMA

### 1. Ahorro de Tiempo
- ❌ **Antes:** Calcular manualmente, crear ingrediente, actualizar cada producto
- ✅ **Ahora:** Marcar checkbox, todo automático

### 2. Precisión
- ❌ **Antes:** Errores de cálculo, olvidos al actualizar
- ✅ **Ahora:** Cálculos exactos, actualizaciones en cascada

### 3. Trazabilidad
- ✅ Sabes exactamente de dónde viene cada ingrediente
- ✅ Ves el impacto de cambios de precio
- ✅ Control total de costos

### 4. Escalabilidad
- ✅ Productos intermedios de productos intermedios
- ✅ Ejemplo: Salsa → Hamburguesa → Combo

---

## 📊 EJEMPLOS REALES

### Pan Casero

```
Producto: Pan Casero - BASE 10 unidades
✅ Es producto intermedio
Rendimiento: 10
Unidad: Unidad

Receta:
- Harina: 1 kg = $500
- Levadura: 20 g = $50
- Sal: 10 g = $5
- Agua: 500 ml = $0
Costo Total: $555

Resultado:
Ingrediente: Pan Casero
Costo: $55.50 por unidad

Uso:
- Sandwich: 2 unidades = $111
- Tostadas: 4 unidades = $222
```

### Salsa BBQ

```
Producto: Salsa BBQ - BASE 2L
✅ Es producto intermedio
Rendimiento: 2000
Unidad: Mililitro

Receta:
- Tomate: 1 kg = $300
- Azúcar: 200 g = $50
- Vinagre: 100 ml = $30
- Especias: 50 g = $120
Costo Total: $500

Resultado:
Ingrediente: Salsa BBQ
Costo: $0.25 por ml

Uso:
- Costillas: 100 ml = $25
- Alitas: 50 ml = $12.50
```

---

## ⚠️ IMPORTANTE

### Validaciones
- ✅ Si marcas "Es producto intermedio", DEBES completar rendimiento
- ✅ El rendimiento debe ser mayor a 0
- ✅ Debes seleccionar una unidad de rendimiento

### Eliminación
- ⚠️ No puedes eliminar un producto intermedio si su ingrediente está siendo usado
- ✅ Primero debes eliminar las recetas que lo usan

### Desmarcado
- ⚠️ Si desmarcas "Es producto intermedio", el ingrediente vinculado se eliminará
- ✅ Solo si no está siendo usado en ninguna receta

---

## 🎯 FLUJO COMPLETO VISUAL

```
┌─────────────────────────────────────────┐
│ 1. CREAR PRODUCTO INTERMEDIO            │
│    ✅ Mayo Casera                        │
│    ✅ Rendimiento: 1000 ml               │
│    ✅ Receta: Huevo + Aceite + Limón     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. SISTEMA AUTO-CREA INGREDIENTE        │
│    ✅ Mayo Casera: $0.90/ml              │
│    ✅ Disponible para usar               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. USAR EN OTROS PRODUCTOS               │
│    ✅ Hamburguesa: Mayo 50ml = $45       │
│    ✅ Sandwich: Mayo 30ml = $27          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 4. CAMBIAR RECETA DE MAYO                │
│    ✅ Nuevo costo: $1,200                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 5. TODO SE ACTUALIZA AUTOMÁTICO          │
│    ✅ Ingrediente: $1.20/ml              │
│    ✅ Hamburguesa: nuevo costo           │
│    ✅ Sandwich: nuevo costo              │
└─────────────────────────────────────────┘
```

---

## 🔍 PREGUNTAS FRECUENTES

### ¿Puedo vender el producto intermedio?
**Sí.** El producto tiene su propio precio de venta. Puedes venderlo como producto normal Y usarlo como ingrediente.

### ¿Qué pasa si cambio el rendimiento?
El costo por unidad del ingrediente se recalcula automáticamente.

### ¿Puedo tener productos intermedios de productos intermedios?
**Sí.** Ejemplo: Salsa → Hamburguesa → Combo. Todo se actualiza en cascada.

### ¿Qué pasa con el stock?
El stock del producto y del ingrediente son independientes. Debes gestionarlos por separado.

### ¿Puedo cambiar la unidad de rendimiento después?
Sí, pero ten cuidado. Puede afectar los cálculos de las recetas que ya lo usan.

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de crear un producto intermedio:

- [ ] ¿Este producto se usará en otros productos?
- [ ] ¿Tiene una receta definida?
- [ ] ¿Sé cuánto produce (rendimiento)?
- [ ] ¿Sé en qué unidad se medirá?

Si respondiste SÍ a todo, ¡es un producto intermedio!

---

## 🎉 ¡LISTO PARA USAR!

El sistema está **100% implementado y funcionando**.

### Próximos Pasos
1. ✅ Recarga el navegador
2. ✅ Ve a Inventario → Nuevo Producto
3. ✅ Crea tu primer producto intermedio
4. ✅ Úsalo en otro producto
5. ✅ Disfruta de la automatización

---

**Fecha**: Diciembre 2024  
**Estado**: ✅ 100% Implementado y Funcionando  
**Versión**: 1.0
