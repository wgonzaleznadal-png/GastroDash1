# 📡 API DE VENTAS - EJEMPLOS DE USO

**Base URL:** `http://localhost:3001/api`  
**Autenticación:** Bearer Token (JWT)  
**Headers requeridos:**
```
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
Content-Type: application/json
```

---

## 🔐 AUTENTICACIÓN

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@gastrodash.com",
  "password": "admin123",
  "tenantSlug": "demo"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "admin@gastrodash.com",
    "nombre": "Admin",
    "rol": "ADMIN"
  },
  "tenant": {
    "id": "tenant-uuid",
    "nombre": "Demo Restaurant",
    "slug": "demo"
  }
}
```

---

## 💰 TURNOS (CAJA)

### 1. Abrir Turno
```http
POST /api/turnos/abrir
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
Content-Type: application/json

{
  "montoInicial": 10000
}
```

**Respuesta:**
```json
{
  "id": "turno-uuid",
  "tenantId": "tenant-uuid",
  "usuarioId": "user-uuid",
  "numero": 1,
  "estado": "ABIERTO",
  "montoInicial": 10000,
  "montoFinal": null,
  "totalEfectivo": 0,
  "totalTarjeta": 0,
  "totalOtros": 0,
  "diferencia": null,
  "notas": null,
  "apertura": "2024-12-02T15:30:00.000Z",
  "cierre": null,
  "usuario": {
    "id": "user-uuid",
    "nombre": "Juan",
    "apellido": "Pérez"
  }
}
```

---

### 2. Obtener Turno Activo
```http
GET /api/turnos/activo
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
```

**Respuesta:**
```json
{
  "id": "turno-uuid",
  "numero": 1,
  "estado": "ABIERTO",
  "montoInicial": 10000,
  "apertura": "2024-12-02T15:30:00.000Z",
  "usuario": {
    "id": "user-uuid",
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "pagos": [
    {
      "id": "pago-uuid",
      "metodo": "EFECTIVO",
      "monto": 5000,
      "estado": "APROBADO",
      "createdAt": "2024-12-02T16:00:00.000Z",
      "venta": {
        "id": "venta-uuid",
        "numero": 1,
        "total": 5000
      }
    }
  ]
}
```

---

### 3. Cerrar Turno
```http
POST /api/turnos/{turno-id}/cerrar
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
Content-Type: application/json

{
  "montoFinal": 45000,
  "notas": "Cierre normal, todo correcto"
}
```

**Respuesta:**
```json
{
  "id": "turno-uuid",
  "numero": 1,
  "estado": "CERRADO",
  "montoInicial": 10000,
  "montoFinal": 45000,
  "totalEfectivo": 35000,
  "totalTarjeta": 25000,
  "totalOtros": 5000,
  "diferencia": 0,
  "notas": "Cierre normal, todo correcto",
  "apertura": "2024-12-02T15:30:00.000Z",
  "cierre": "2024-12-02T23:30:00.000Z",
  "usuario": {
    "id": "user-uuid",
    "nombre": "Juan",
    "apellido": "Pérez"
  }
}
```

---

### 4. Obtener Estadísticas de Turno
```http
GET /api/turnos/{turno-id}/estadisticas
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
```

**Respuesta:**
```json
{
  "turno": {
    "id": "turno-uuid",
    "numero": 1,
    "estado": "CERRADO",
    "apertura": "2024-12-02T15:30:00.000Z",
    "cierre": "2024-12-02T23:30:00.000Z",
    "montoInicial": 10000,
    "montoFinal": 45000,
    "diferencia": 0
  },
  "estadisticas": {
    "totalVentas": 45,
    "montoTotal": 65000,
    "porMetodo": {
      "EFECTIVO": {
        "cantidad": 30,
        "monto": 35000
      },
      "TARJETA_CREDITO": {
        "cantidad": 10,
        "monto": 25000
      },
      "MERCADO_PAGO": {
        "cantidad": 5,
        "monto": 5000
      }
    },
    "totalEfectivo": 35000,
    "totalTarjeta": 25000,
    "totalOtros": 5000
  }
}
```

---

### 5. Listar Turnos
```http
GET /api/turnos?estado=CERRADO&fechaDesde=2024-12-01&fechaHasta=2024-12-31
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
```

**Query Parameters:**
- `estado`: ABIERTO | CERRADO
- `usuarioId`: UUID del usuario
- `fechaDesde`: YYYY-MM-DD
- `fechaHasta`: YYYY-MM-DD

**Respuesta:**
```json
[
  {
    "id": "turno-uuid-1",
    "numero": 1,
    "estado": "CERRADO",
    "montoInicial": 10000,
    "montoFinal": 45000,
    "totalEfectivo": 35000,
    "totalTarjeta": 25000,
    "totalOtros": 5000,
    "diferencia": 0,
    "apertura": "2024-12-02T15:30:00.000Z",
    "cierre": "2024-12-02T23:30:00.000Z",
    "usuario": {
      "id": "user-uuid",
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  }
]
```

---

## 🛒 VENTAS

### 1. Crear Venta (Caso Simple)
```http
POST /api/ventas
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
Content-Type: application/json

{
  "tipo": "MOSTRADOR",
  "items": [
    {
      "productoId": "producto-uuid-1",
      "cantidad": 2,
      "precio": 1500
    },
    {
      "productoId": "producto-uuid-2",
      "cantidad": 1,
      "precio": 2000
    }
  ],
  "subtotal": 5000,
  "total": 5000,
  "pagos": [
    {
      "metodo": "EFECTIVO",
      "monto": 5000
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": "venta-uuid",
  "tenantId": "tenant-uuid",
  "numero": 1,
  "clienteId": null,
  "usuarioId": "user-uuid",
  "mesaId": null,
  "tipo": "MOSTRADOR",
  "estado": "CONFIRMADA",
  "subtotal": 5000,
  "descuento": 0,
  "propina": 0,
  "total": 5000,
  "createdAt": "2024-12-02T16:00:00.000Z",
  "updatedAt": "2024-12-02T16:00:00.000Z",
  "createdBy": "user-uuid",
  "items": [
    {
      "id": "item-uuid-1",
      "ventaId": "venta-uuid",
      "productoId": "producto-uuid-1",
      "cantidad": 2,
      "precio": 1500,
      "subtotal": 3000,
      "notas": null,
      "createdAt": "2024-12-02T16:00:00.000Z",
      "producto": {
        "id": "producto-uuid-1",
        "nombre": "Hamburguesa Clásica",
        "precio": 1500
      }
    },
    {
      "id": "item-uuid-2",
      "ventaId": "venta-uuid",
      "productoId": "producto-uuid-2",
      "cantidad": 1,
      "precio": 2000,
      "subtotal": 2000,
      "notas": null,
      "createdAt": "2024-12-02T16:00:00.000Z",
      "producto": {
        "id": "producto-uuid-2",
        "nombre": "Pizza Margherita",
        "precio": 2000
      }
    }
  ],
  "pagos": [
    {
      "id": "pago-uuid",
      "tenantId": "tenant-uuid",
      "ventaId": "venta-uuid",
      "turnoId": null,
      "metodo": "EFECTIVO",
      "monto": 5000,
      "estado": "APROBADO",
      "referencia": null,
      "notas": null,
      "createdAt": "2024-12-02T16:00:00.000Z",
      "createdBy": "user-uuid"
    }
  ],
  "cliente": null,
  "usuario": {
    "id": "user-uuid",
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "mesa": null
}
```

---

### 2. Crear Venta con Descuento y Propina
```http
POST /api/ventas
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
Content-Type: application/json

{
  "tipo": "MESA",
  "clienteId": "cliente-uuid",
  "mesaId": "mesa-uuid",
  "items": [
    {
      "productoId": "producto-uuid-1",
      "cantidad": 1,
      "precio": 2500
    },
    {
      "productoId": "producto-uuid-2",
      "cantidad": 2,
      "precio": 500
    }
  ],
  "subtotal": 3500,
  "descuento": 350,
  "propina": 400,
  "total": 3550,
  "pagos": [
    {
      "metodo": "TARJETA_CREDITO",
      "monto": 3550,
      "referencia": "TRX-789456"
    }
  ]
}
```

---

### 3. Crear Venta con Pago Dividido
```http
POST /api/ventas
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
Content-Type: application/json

{
  "tipo": "MESA",
  "mesaId": "mesa-uuid",
  "items": [
    {
      "productoId": "producto-uuid-1",
      "cantidad": 3,
      "precio": 2000
    },
    {
      "productoId": "producto-uuid-2",
      "cantidad": 3,
      "precio": 800
    }
  ],
  "subtotal": 8400,
  "total": 8400,
  "pagos": [
    {
      "metodo": "EFECTIVO",
      "monto": 4200
    },
    {
      "metodo": "TARJETA_DEBITO",
      "monto": 4200,
      "referencia": "TRX-456789"
    }
  ]
}
```

---

### 4. Crear Venta con Modificadores
```http
POST /api/ventas
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
Content-Type: application/json

{
  "tipo": "MOSTRADOR",
  "items": [
    {
      "productoId": "hamburguesa-uuid",
      "cantidad": 1,
      "precio": 1500,
      "notas": "Sin cebolla, extra queso, punto medio"
    },
    {
      "productoId": "papas-uuid",
      "cantidad": 1,
      "precio": 600,
      "notas": "Con cheddar"
    }
  ],
  "subtotal": 2100,
  "total": 2100,
  "pagos": [
    {
      "metodo": "MERCADO_PAGO",
      "monto": 2100,
      "referencia": "MP-123456789"
    }
  ]
}
```

---

### 5. Listar Ventas
```http
GET /api/ventas?estado=CONFIRMADA&tipo=MOSTRADOR&fechaDesde=2024-12-01&fechaHasta=2024-12-31
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
```

**Query Parameters:**
- `estado`: PENDIENTE | CONFIRMADA | EN_PREPARACION | LISTA | ENTREGADA | CANCELADA
- `tipo`: MOSTRADOR | MESA | DELIVERY | ONLINE
- `fechaDesde`: YYYY-MM-DD
- `fechaHasta`: YYYY-MM-DD

**Respuesta:**
```json
[
  {
    "id": "venta-uuid-1",
    "numero": 1,
    "tipo": "MOSTRADOR",
    "estado": "CONFIRMADA",
    "subtotal": 5000,
    "descuento": 0,
    "propina": 0,
    "total": 5000,
    "createdAt": "2024-12-02T16:00:00.000Z",
    "items": [...],
    "pagos": [...],
    "cliente": null,
    "usuario": {...},
    "mesa": null
  }
]
```

---

### 6. Obtener Venta por ID
```http
GET /api/ventas/{venta-id}
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
```

**Respuesta:** (igual que crear venta)

---

### 7. Cancelar Venta
```http
PATCH /api/ventas/{venta-id}/cancelar
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
```

**Respuesta:**
```json
{
  "id": "venta-uuid",
  "estado": "CANCELADA",
  ...
}
```

---

### 8. Obtener Estadísticas de Ventas
```http
GET /api/ventas/estadisticas?fechaDesde=2024-12-01&fechaHasta=2024-12-31
Authorization: Bearer {token}
x-tenant-id: {tenant-id}
```

**Respuesta:**
```json
{
  "totalVentas": 125000,
  "cantidadVentas": 45,
  "ventasPorTipo": [
    {
      "tipo": "MOSTRADOR",
      "_count": 30,
      "_sum": {
        "total": 75000
      }
    },
    {
      "tipo": "MESA",
      "_count": 10,
      "_sum": {
        "total": 35000
      }
    },
    {
      "tipo": "DELIVERY",
      "_count": 5,
      "_sum": {
        "total": 15000
      }
    }
  ],
  "promedioVenta": 2777.78
}
```

---

## 🔄 FLUJO COMPLETO DE TRABAJO

### Escenario: Turno de Caja Completo

```bash
# 1. Login
POST /api/auth/login
{
  "email": "cajero@gastrodash.com",
  "password": "cajero123",
  "tenantSlug": "demo"
}
# Guardar token

# 2. Abrir Turno
POST /api/turnos/abrir
{
  "montoInicial": 10000
}
# Guardar turno-id

# 3. Crear Venta 1
POST /api/ventas
{
  "tipo": "MOSTRADOR",
  "items": [{"productoId": "...", "cantidad": 2, "precio": 1500}],
  "subtotal": 3000,
  "total": 3000,
  "pagos": [{"metodo": "EFECTIVO", "monto": 3000}]
}

# 4. Crear Venta 2
POST /api/ventas
{
  "tipo": "MESA",
  "mesaId": "...",
  "items": [...],
  "subtotal": 5000,
  "total": 5000,
  "pagos": [{"metodo": "TARJETA_CREDITO", "monto": 5000, "referencia": "TRX-123"}]
}

# 5. Ver Turno Activo
GET /api/turnos/activo
# Ver pagos acumulados

# 6. Cerrar Turno
POST /api/turnos/{turno-id}/cerrar
{
  "montoFinal": 13000,
  "notas": "Cierre normal"
}

# 7. Ver Estadísticas
GET /api/turnos/{turno-id}/estadisticas
```

---

## ❌ MANEJO DE ERRORES

### Error: Stock Insuficiente
```json
{
  "error": "Stock insuficiente para Hamburguesa Clásica. Disponible: 5",
  "statusCode": 400
}
```

### Error: Turno Ya Abierto
```json
{
  "error": "Ya existe un turno abierto para este usuario",
  "statusCode": 400
}
```

### Error: Venta No Encontrada
```json
{
  "error": "Venta no encontrada",
  "statusCode": 404
}
```

### Error: Validación
```json
{
  "error": "Validation error",
  "issues": [
    {
      "path": ["items"],
      "message": "Debe haber al menos un item"
    },
    {
      "path": ["pagos"],
      "message": "Debe haber al menos un pago"
    }
  ],
  "statusCode": 400
}
```

---

## 🧪 TESTING CON CURL

### Abrir Turno
```bash
curl -X POST http://localhost:3001/api/turnos/abrir \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"montoInicial": 10000}'
```

### Crear Venta
```bash
curl -X POST http://localhost:3001/api/ventas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "MOSTRADOR",
    "items": [
      {"productoId": "PRODUCTO_UUID", "cantidad": 2, "precio": 1500}
    ],
    "subtotal": 3000,
    "total": 3000,
    "pagos": [
      {"metodo": "EFECTIVO", "monto": 3000}
    ]
  }'
```

---

**¡API de Ventas lista para usar!** 🎉

**Documentación completa en:** `/IMPLEMENTACION-MODULO-VENTAS.md`
