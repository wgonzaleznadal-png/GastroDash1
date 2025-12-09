# 🛒 IMPLEMENTACIÓN MÓDULO DE VENTAS/POS

**Fecha:** 2 de Diciembre, 2024  
**Estado:** ✅ Backend completado (Base de Datos + Servicios)  
**Progreso:** 50% (Backend listo, falta Frontend)

---

## 📋 RESUMEN

Se ha implementado la base completa del módulo de Ventas/POS incluyendo:
- ✅ Modelos de base de datos (Venta, ItemVenta, Pago, Turno)
- ✅ Servicios backend (VentaService, TurnoService)
- ✅ Migración de base de datos aplicada
- 📋 Pendiente: Controllers y rutas
- 📋 Pendiente: Frontend (interfaz POS)

---

## 🗄️ BASE DE DATOS

### Modelos Creados/Actualizados

#### 1. **Venta** (Actualizado)
```prisma
model Venta {
  id          String      @id @default(uuid())
  tenantId    String
  numero      Int         // Número secuencial por tenant
  clienteId   String?
  usuarioId   String
  mesaId      String?
  
  tipo        TipoVenta   @default(MOSTRADOR)
  estado      EstadoVenta @default(PENDIENTE)
  
  subtotal    Decimal     @db.Decimal(10, 2)
  descuento   Decimal     @default(0) @db.Decimal(10, 2)
  propina     Decimal     @default(0) @db.Decimal(10, 2) // ✅ NUEVO
  total       Decimal     @db.Decimal(10, 2)
  
  // Relaciones
  tenant      Tenant
  cliente     Cliente?
  usuario     Usuario
  mesa        Mesa?
  items       ItemVenta[]
  pagos       Pago[]      // ✅ NUEVO
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  createdBy   String
}
```

**Cambios:**
- ✅ Agregado campo `propina`
- ✅ Agregado relación `pagos`
- ❌ Eliminado campo `metodoPago` (ahora se maneja en modelo Pago)

---

#### 2. **ItemVenta** (Actualizado)
```prisma
model ItemVenta {
  id         String   @id @default(uuid())
  ventaId    String
  productoId String
  
  cantidad   Int
  precio     Decimal  @db.Decimal(10, 2)
  subtotal   Decimal  @db.Decimal(10, 2)
  notas      String?  // ✅ NUEVO (ej: "sin cebolla", "extra queso")
  
  venta      Venta
  producto   Producto
  
  createdAt  DateTime @default(now())
}
```

**Cambios:**
- ✅ Agregado campo `notas` para modificadores

---

#### 3. **Pago** (NUEVO)
```prisma
enum MetodoPago {
  EFECTIVO
  TARJETA_DEBITO
  TARJETA_CREDITO
  TRANSFERENCIA
  MERCADO_PAGO
  QR
  OTRO
}

enum EstadoPago {
  PENDIENTE
  APROBADO
  RECHAZADO
  CANCELADO
}

model Pago {
  id          String      @id @default(uuid())
  tenantId    String
  ventaId     String
  turnoId     String?
  
  metodo      MetodoPago
  monto       Decimal     @db.Decimal(10, 2)
  estado      EstadoPago  @default(PENDIENTE)
  
  referencia  String?     // Número de transacción, cheque, etc.
  notas       String?
  
  tenant      Tenant
  venta       Venta
  turno       Turno?
  
  createdAt   DateTime    @default(now())
  createdBy   String
}
```

**Características:**
- ✅ Soporte para múltiples métodos de pago
- ✅ Una venta puede tener múltiples pagos (pago dividido)
- ✅ Vinculado a turno para cierre de caja
- ✅ Estados de pago (pendiente, aprobado, rechazado)

---

#### 4. **Turno** (NUEVO)
```prisma
enum EstadoTurno {
  ABIERTO
  CERRADO
}

model Turno {
  id              String      @id @default(uuid())
  tenantId        String
  usuarioId       String
  numero          Int         // Número secuencial por tenant
  
  estado          EstadoTurno @default(ABIERTO)
  
  montoInicial    Decimal     @db.Decimal(10, 2)
  montoFinal      Decimal?    @db.Decimal(10, 2)
  
  totalEfectivo   Decimal     @default(0) @db.Decimal(10, 2)
  totalTarjeta    Decimal     @default(0) @db.Decimal(10, 2)
  totalOtros      Decimal     @default(0) @db.Decimal(10, 2)
  
  diferencia      Decimal?    @db.Decimal(10, 2)
  notas           String?
  
  tenant          Tenant
  usuario         Usuario
  pagos           Pago[]
  
  apertura        DateTime    @default(now())
  cierre          DateTime?
}
```

**Características:**
- ✅ Control de caja por cajero
- ✅ Monto inicial y final
- ✅ Totales automáticos por método de pago
- ✅ Cálculo de diferencia (faltante/sobrante)
- ✅ Historial de turnos

---

## 🔧 SERVICIOS BACKEND

### 1. **VentaService** (Actualizado)

#### Métodos Principales:

##### `createVenta(tenantId, usuarioId, data)`
Crea una nueva venta con items y pagos.

**Características:**
- ✅ Validación de stock de productos
- ✅ Generación automática de número de venta
- ✅ Creación de items de venta
- ✅ Actualización automática de stock
- ✅ Creación de pagos asociados
- ✅ Transacción atómica (todo o nada)

**Ejemplo de uso:**
```typescript
const venta = await ventaService.createVenta(tenantId, usuarioId, {
  tipo: 'MOSTRADOR',
  items: [
    { productoId: 'prod-1', cantidad: 2, precio: 1500, notas: 'Sin cebolla' },
    { productoId: 'prod-2', cantidad: 1, precio: 2000 }
  ],
  subtotal: 5000,
  descuento: 500,
  propina: 300,
  total: 4800,
  pagos: [
    { metodo: 'EFECTIVO', monto: 3000 },
    { metodo: 'TARJETA_CREDITO', monto: 1800, referencia: 'TRX-12345' }
  ]
});
```

##### `getVentas(tenantId, filters?)`
Obtiene listado de ventas con filtros.

**Filtros disponibles:**
- `estado`: PENDIENTE, CONFIRMADA, EN_PREPARACION, LISTA, ENTREGADA, CANCELADA
- `tipo`: MOSTRADOR, MESA, DELIVERY, ONLINE
- `fechaDesde`: Date
- `fechaHasta`: Date

##### `getVentaById(tenantId, id)`
Obtiene detalle completo de una venta.

**Incluye:**
- Items con productos
- Pagos
- Cliente
- Usuario (cajero)
- Mesa

##### `cancelarVenta(tenantId, id)`
Cancela una venta y devuelve el stock.

**Características:**
- ✅ Validación de estado
- ✅ Devolución automática de stock
- ✅ Transacción atómica

##### `getEstadisticas(tenantId, fechaDesde?, fechaHasta?)`
Obtiene estadísticas de ventas.

**Retorna:**
- Total de ventas (monto)
- Cantidad de ventas
- Ventas por tipo
- Promedio de venta

---

### 2. **TurnoService** (NUEVO)

#### Métodos Principales:

##### `abrirTurno(tenantId, usuarioId, data)`
Abre un nuevo turno de caja.

**Características:**
- ✅ Validación de turno único por usuario
- ✅ Generación automática de número de turno
- ✅ Registro de monto inicial

**Ejemplo de uso:**
```typescript
const turno = await turnoService.abrirTurno(tenantId, usuarioId, {
  montoInicial: 10000  // Fondo de caja inicial
});
```

##### `getTurnoActivo(tenantId, usuarioId)`
Obtiene el turno activo del usuario.

**Incluye:**
- Datos del turno
- Usuario
- Todos los pagos del turno
- Ventas asociadas

##### `cerrarTurno(tenantId, turnoId, data)`
Cierra un turno y calcula totales.

**Características:**
- ✅ Cálculo automático de totales por método de pago
- ✅ Cálculo de diferencia (faltante/sobrante)
- ✅ Registro de monto final
- ✅ Fecha y hora de cierre

**Ejemplo de uso:**
```typescript
const turnoCerrado = await turnoService.cerrarTurno(tenantId, turnoId, {
  montoFinal: 45000,  // Efectivo contado en caja
  notas: 'Todo correcto'
});

// Retorna:
// {
//   ...turno,
//   totalEfectivo: 35000,
//   totalTarjeta: 25000,
//   totalOtros: 5000,
//   diferencia: 0  // (45000 - 10000 - 35000)
// }
```

##### `getTurnos(tenantId, filters?)`
Obtiene historial de turnos.

**Filtros disponibles:**
- `usuarioId`: Filtrar por cajero
- `estado`: ABIERTO, CERRADO
- `fechaDesde`: Date
- `fechaHasta`: Date

##### `getTurnoById(tenantId, id)`
Obtiene detalle completo de un turno.

**Incluye:**
- Datos del turno
- Usuario
- Todos los pagos con ventas
- Ordenados cronológicamente

##### `getEstadisticasTurno(tenantId, turnoId)`
Obtiene estadísticas detalladas de un turno.

**Retorna:**
```typescript
{
  turno: {
    id, numero, estado, apertura, cierre,
    montoInicial, montoFinal, diferencia
  },
  estadisticas: {
    totalVentas: 45,
    montoTotal: 65000,
    porMetodo: {
      EFECTIVO: { cantidad: 30, monto: 35000 },
      TARJETA_CREDITO: { cantidad: 10, monto: 25000 },
      MERCADO_PAGO: { cantidad: 5, monto: 5000 }
    },
    totalEfectivo: 35000,
    totalTarjeta: 25000,
    totalOtros: 5000
  }
}
```

---

## 🔄 FLUJO DE TRABAJO

### Flujo Completo de Venta

```
1. APERTURA DE TURNO
   ├─ Cajero abre turno
   ├─ Registra monto inicial (fondo de caja)
   └─ Sistema genera número de turno

2. CREAR VENTA
   ├─ Seleccionar productos
   ├─ Agregar cantidades y notas
   ├─ Calcular subtotal
   ├─ Aplicar descuentos (opcional)
   ├─ Agregar propina (opcional)
   ├─ Calcular total
   └─ Sistema genera número de venta

3. PROCESAR PAGOS
   ├─ Seleccionar método(s) de pago
   ├─ Ingresar montos
   ├─ Registrar referencias (opcional)
   └─ Sistema vincula pagos al turno

4. CONFIRMAR VENTA
   ├─ Sistema valida stock
   ├─ Crea venta + items + pagos (transacción)
   ├─ Actualiza stock de productos
   └─ Retorna venta confirmada

5. CIERRE DE TURNO
   ├─ Contar efectivo en caja
   ├─ Ingresar monto final
   ├─ Sistema calcula totales por método
   ├─ Sistema calcula diferencia
   └─ Cierra turno con reporte
```

---

## 📊 CASOS DE USO

### Caso 1: Venta Simple (Mostrador)
```typescript
// Cliente compra 2 hamburguesas y paga en efectivo

const venta = await ventaService.createVenta(tenantId, cajeroId, {
  tipo: 'MOSTRADOR',
  items: [
    { productoId: 'hamburguesa-id', cantidad: 2, precio: 1500 }
  ],
  subtotal: 3000,
  total: 3000,
  pagos: [
    { metodo: 'EFECTIVO', monto: 3000 }
  ]
});
```

### Caso 2: Venta con Descuento y Propina
```typescript
// Cliente habitual con 10% descuento y deja propina

const venta = await ventaService.createVenta(tenantId, cajeroId, {
  tipo: 'MESA',
  clienteId: 'cliente-vip-id',
  mesaId: 'mesa-5-id',
  items: [
    { productoId: 'pizza-id', cantidad: 1, precio: 2500 },
    { productoId: 'bebida-id', cantidad: 2, precio: 500 }
  ],
  subtotal: 3500,
  descuento: 350,  // 10%
  propina: 400,
  total: 3550,
  pagos: [
    { metodo: 'TARJETA_CREDITO', monto: 3550, referencia: 'TRX-789' }
  ]
});
```

### Caso 3: Pago Dividido
```typescript
// Grupo divide la cuenta: mitad efectivo, mitad tarjeta

const venta = await ventaService.createVenta(tenantId, cajeroId, {
  tipo: 'MESA',
  mesaId: 'mesa-10-id',
  items: [
    { productoId: 'plato-1', cantidad: 3, precio: 2000 },
    { productoId: 'postre-1', cantidad: 3, precio: 800 }
  ],
  subtotal: 8400,
  total: 8400,
  pagos: [
    { metodo: 'EFECTIVO', monto: 4200 },
    { metodo: 'TARJETA_DEBITO', monto: 4200, referencia: 'TRX-456' }
  ]
});
```

### Caso 4: Venta con Modificadores
```typescript
// Cliente pide hamburguesa personalizada

const venta = await ventaService.createVenta(tenantId, cajeroId, {
  tipo: 'MOSTRADOR',
  items: [
    { 
      productoId: 'hamburguesa-id', 
      cantidad: 1, 
      precio: 1500,
      notas: 'Sin cebolla, extra queso, punto medio'
    },
    { 
      productoId: 'papas-id', 
      cantidad: 1, 
      precio: 600,
      notas: 'Con cheddar'
    }
  ],
  subtotal: 2100,
  total: 2100,
  pagos: [
    { metodo: 'MERCADO_PAGO', monto: 2100, referencia: 'MP-12345' }
  ]
});
```

---

## 🎯 PRÓXIMOS PASOS

### Backend (Pendiente)
1. [ ] Crear controllers para ventas
2. [ ] Crear controllers para turnos
3. [ ] Crear rutas API
4. [ ] Agregar validaciones con Zod
5. [ ] Agregar tests unitarios
6. [ ] Agregar tests de integración

### Frontend (Pendiente)
1. [ ] Crear interfaz POS
2. [ ] Pantalla de selección de productos
3. [ ] Carrito de compra
4. [ ] Pantalla de pago
5. [ ] Gestión de turnos
6. [ ] Cierre de caja
7. [ ] Reportes de ventas
8. [ ] Impresión de tickets

---

## 📝 NOTAS TÉCNICAS

### Transacciones
Todas las operaciones críticas usan transacciones de Prisma:
- ✅ Crear venta (venta + items + pagos + actualizar stock)
- ✅ Cancelar venta (cambiar estado + devolver stock)
- ✅ Cerrar turno (actualizar totales + cerrar)

### Números Secuenciales
Los números de venta y turno son secuenciales por tenant:
```typescript
const ultimaVenta = await tx.venta.findFirst({
  where: { tenantId },
  orderBy: { numero: 'desc' },
});
const numero = (ultimaVenta?.numero || 0) + 1;
```

### Validaciones
- ✅ Stock suficiente antes de crear venta
- ✅ Un solo turno abierto por usuario
- ✅ Turno debe estar abierto para cerrarlo
- ✅ Venta no puede estar ya cancelada

### Cálculos Automáticos
- ✅ Subtotal de items (cantidad × precio)
- ✅ Total de venta (subtotal - descuento + propina)
- ✅ Totales por método de pago en turno
- ✅ Diferencia en cierre de caja

---

## 🐛 ERRORES CONOCIDOS

### TypeScript Lints
Los errores de TypeScript actuales son por cache del IDE:
- Los tipos de Prisma están correctos en `node_modules/@prisma/client`
- Solución: Reiniciar TypeScript Server en el IDE
- Comando: `Developer: Reload Window` o reiniciar VS Code

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos
- [x] Modelo Venta actualizado
- [x] Modelo ItemVenta actualizado
- [x] Modelo Pago creado
- [x] Modelo Turno creado
- [x] Enums creados (MetodoPago, EstadoPago, EstadoTurno)
- [x] Relaciones configuradas
- [x] Migración aplicada
- [x] Prisma Client regenerado

### Backend - Servicios
- [x] VentaService actualizado
- [x] TurnoService creado
- [ ] Controllers creados
- [ ] Rutas API creadas
- [ ] Validaciones agregadas
- [ ] Tests escritos

### Frontend
- [ ] Interfaz POS
- [ ] Gestión de turnos
- [ ] Reportes

---

**¡Módulo de Ventas/POS - Backend completado!** 🎉

**Progreso:** 50% (Backend listo, falta Controllers, Rutas y Frontend)
