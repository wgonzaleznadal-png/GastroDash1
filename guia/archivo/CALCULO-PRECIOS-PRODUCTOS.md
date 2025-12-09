# 💰 Sistema de Cálculo de Precios por Porcentajes

## ✅ Funcionalidad Implementada

Se agregó un sistema completo para calcular el precio de venta de productos basado en el costo y porcentajes incrementales.

---

## 🎯 Cómo Funciona

### Fórmula de Cálculo

```
Precio Final = Costo Base + (Costo × Impuestos%) + (Costo × Beneficio%) + (Costo × Otros%)
```

### Ejemplo Práctico

**Producto: Pizza Muzzarella**
- Costo Base: $2,000
- Impuestos: 21% = $420
- Beneficio: 30% = $600
- Otros gastos: 5% = $100

**Precio Final = $2,000 + $420 + $600 + $100 = $3,120**

---

## 📋 Campos Agregados

### Backend

**ProductoService:**
- `porcentajeImpuestos` (0-100%)
- `porcentajeBeneficio` (0-100%)
- `porcentajeOtros` (0-100%)
- `calcularPrecioAutomatico` (boolean)
- Método `calcularPrecioVenta()` privado

**Validación con Zod:**
- Porcentajes entre 0 y 100
- Todos los campos opcionales
- Cálculo automático opcional

### Frontend

**Interfaz de Usuario:**
- Campo "Costo Base"
- 3 campos de porcentajes (Impuestos, Beneficio, Otros)
- Botón "Calcular Precio"
- Vista previa del precio sugerido
- Campo "Precio de Venta Final" (editable)

---

## 🎨 Interfaz de Usuario

### Sección de Cálculo

La nueva sección en el formulario de productos incluye:

1. **Costo Base**
   - Campo numérico con símbolo $
   - Ayuda: "Costo de adquisición o producción"

2. **Cálculo de Precio de Venta** (área destacada)
   - **Impuestos %**: IVA, impuestos locales, etc.
   - **Beneficio %**: Margen de ganancia deseado
   - **Otros %**: Gastos adicionales (envío, comisiones, etc.)

3. **Botón "Calcular Precio"**
   - Calcula automáticamente el precio
   - Muestra precio sugerido en tiempo real
   - Se deshabilita si no hay costo base

4. **Precio de Venta Final**
   - Muestra el precio calculado
   - Editable manualmente
   - Ayuda: "Puedes ajustar manualmente el precio calculado"

---

## 💻 Uso en la Aplicación

### Crear Producto con Cálculo Automático

1. Ir a **Inventario** → **Nuevo Producto**
2. Completar nombre, categoría, etc.
3. Ingresar **Costo Base**: Ej. $1,500
4. Configurar porcentajes:
   - Impuestos: 21%
   - Beneficio: 40%
   - Otros: 5%
5. Click en **"Calcular Precio"**
6. El sistema calcula: $1,500 + $315 + $600 + $75 = **$2,490**
7. Ajustar manualmente si es necesario
8. Guardar producto

### Editar Producto

1. Click en **Editar** en un producto existente
2. Modificar el costo base
3. Ajustar porcentajes según necesidad
4. Recalcular precio
5. Guardar cambios

---

## 🔢 Ejemplos de Uso

### Ejemplo 1: Producto Simple

**Empanadas de Carne**
- Costo: $800
- Impuestos: 0% (exento)
- Beneficio: 50%
- Otros: 0%

**Cálculo:**
- Impuestos: $800 × 0% = $0
- Beneficio: $800 × 50% = $400
- Otros: $800 × 0% = $0
- **Precio Final: $1,200**

### Ejemplo 2: Producto con IVA

**Milanesa con Papas**
- Costo: $2,800
- Impuestos: 21% (IVA)
- Beneficio: 35%
- Otros: 10% (delivery, packaging)

**Cálculo:**
- Impuestos: $2,800 × 21% = $588
- Beneficio: $2,800 × 35% = $980
- Otros: $2,800 × 10% = $280
- **Precio Final: $4,648 → $4,650 (redondeado)**

### Ejemplo 3: Bebidas

**Coca Cola 500ml**
- Costo: $600
- Impuestos: 21%
- Beneficio: 60%
- Otros: 5%

**Cálculo:**
- Impuestos: $600 × 21% = $126
- Beneficio: $600 × 60% = $360
- Otros: $600 × 5% = $30
- **Precio Final: $1,116 → $1,120 (redondeado)**

---

## 🎯 Casos de Uso

### 1. Restaurante

**Configuración típica:**
- Impuestos: 21% (IVA)
- Beneficio: 30-50% (margen del negocio)
- Otros: 5-10% (gastos operativos)

### 2. Delivery

**Configuración típica:**
- Impuestos: 21%
- Beneficio: 25-35%
- Otros: 15-20% (comisión plataforma + envío)

### 3. Cafetería

**Configuración típica:**
- Impuestos: 10.5% (IVA reducido)
- Beneficio: 40-60%
- Otros: 5% (descartables, servilletas)

---

## 🔧 Características Técnicas

### Backend

**Método de Cálculo:**
```typescript
private calcularPrecioVenta(
  costo: number,
  porcentajeImpuestos: number = 0,
  porcentajeBeneficio: number = 0,
  porcentajeOtros: number = 0
): number {
  const impuestos = costo * (porcentajeImpuestos / 100);
  const beneficio = costo * (porcentajeBeneficio / 100);
  const otros = costo * (porcentajeOtros / 100);
  
  return Math.round(costo + impuestos + beneficio + otros);
}
```

**Características:**
- Redondeo automático al entero más cercano
- Valores por defecto en 0
- Cálculo en crear y actualizar producto

### Frontend

**Cálculo en Tiempo Real:**
```typescript
const calcularPrecioAutomatico = () => {
  if (!formData.costo) return 0;
  
  const impuestos = formData.costo * ((formData.porcentajeImpuestos || 0) / 100);
  const beneficio = formData.costo * ((formData.porcentajeBeneficio || 0) / 100);
  const otros = formData.costo * ((formData.porcentajeOtros || 0) / 100);
  
  return Math.round(formData.costo + impuestos + beneficio + otros);
};
```

**Características:**
- Vista previa en tiempo real
- Actualización automática al cambiar porcentajes
- Permite ajuste manual del precio final

---

## 📊 Ventajas del Sistema

### 1. Consistencia
- Todos los productos usan la misma fórmula
- Fácil ajustar márgenes globalmente

### 2. Transparencia
- Se ve claramente el desglose de costos
- Fácil justificar precios

### 3. Flexibilidad
- Porcentajes ajustables por producto
- Precio final editable manualmente
- Cálculo opcional

### 4. Rapidez
- Cálculo instantáneo
- No necesitas calculadora
- Menos errores humanos

---

## 🚀 Próximas Mejoras Sugeridas

### Funcionalidades Adicionales

1. **Plantillas de Porcentajes**
   - Guardar configuraciones predefinidas
   - Ej: "Platos principales", "Bebidas", "Postres"

2. **Historial de Precios**
   - Registrar cambios de precio
   - Ver evolución de costos

3. **Alertas de Margen**
   - Notificar si el margen es muy bajo
   - Sugerir ajustes de precio

4. **Cálculo Inverso**
   - Ingresar precio deseado
   - Calcular margen obtenido

5. **Reportes**
   - Margen promedio por categoría
   - Productos con mejor/peor margen

---

## 📝 Notas Importantes

### Redondeo
- El sistema redondea al entero más cercano
- Esto evita centavos en el precio final

### Edición Manual
- Siempre puedes ajustar el precio calculado
- El sistema respeta tu decisión final

### Porcentajes Acumulativos
- Los porcentajes se suman sobre el costo base
- No son compuestos (no se aplican uno sobre otro)

---

## ✅ Checklist de Implementación

- [x] Backend: Campos agregados al modelo
- [x] Backend: Método de cálculo implementado
- [x] Backend: Validación con Zod
- [x] Backend: Cálculo en crear producto
- [x] Backend: Cálculo en actualizar producto
- [x] Frontend: Interfaces actualizadas
- [x] Frontend: Campos en formulario
- [x] Frontend: Función de cálculo
- [x] Frontend: Vista previa de precio
- [x] Frontend: Botón de calcular
- [x] Frontend: Precio editable
- [x] Documentación completa

---

**Estado**: ✅ Implementado y funcional  
**Versión**: 1.0  
**Fecha**: Diciembre 2024
