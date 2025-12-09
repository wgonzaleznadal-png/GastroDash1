# 🏗️ Arquitectura General - GastroDash Pro

## 📋 Tabla de Contenidos
- [Visión General](#visión-general)
- [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
- [Capas de la Aplicación](#capas-de-la-aplicación)
- [Flujo de Datos](#flujo-de-datos)
- [Patrones de Diseño](#patrones-de-diseño)
- [Escalabilidad](#escalabilidad)

---

## 🎯 Visión General

GastroDash Pro es un sistema **multitenant** completo para gestión gastronómica que integra:
- 15+ módulos funcionales
- 10+ integraciones externas
- IA y automatización
- Múltiples canales de venta
- Analytics en tiempo real

### Principios Arquitectónicos

1. **Multitenant First**
   - Aislamiento total de datos por tenant
   - Configuración por tenant
   - Escalabilidad horizontal

2. **Microservicios Modulares**
   - Servicios independientes
   - Comunicación asíncrona
   - Despliegue independiente

3. **Event-Driven**
   - Eventos de dominio
   - CQRS para lectura/escritura
   - Event sourcing para auditoría

4. **API-First**
   - REST API completa
   - GraphQL para queries complejas
   - WebSockets para tiempo real

---

## 🏛️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │   Admin      │      │
│  │  (Next.js)   │  │  (React      │  │   Panel      │      │
│  │              │  │   Native)    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  KDS Screen  │  │  Carta QR    │  │  WhatsApp    │      │
│  │              │  │              │  │    Bot       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
├─────────────────────────────────────────────────────────────┤
│  • Autenticación JWT                                         │
│  • Rate Limiting                                             │
│  • Tenant Resolution                                         │
│  • Request Routing                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Ventas  │ │Inventario│ │  Cocina  │ │  Mesas   │       │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Delivery │ │Marketing │ │ Finanzas │ │    IA    │       │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE DATOS                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │  RabbitMQ    │      │
│  │  (Principal) │  │   (Cache)    │  │  (Eventos)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │      S3      │  │  Elasticsearch│ │  TimescaleDB │      │
│  │  (Archivos)  │  │   (Búsqueda) │  │  (Métricas)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                INTEGRACIONES EXTERNAS                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • OpenAI (IA)              • Twilio (WhatsApp)              │
│  • MercadoPago (Pagos)      • Google Maps (Mapas)           │
│  • Rappi API                • PedidosYa API                  │
│  • AFIP (Facturación)       • SendGrid (Email)              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Capas de la Aplicación

### 1. Capa de Presentación

#### Frontend Web (Next.js + MUI)
```typescript
frontend/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── (auth)/            # Rutas de autenticación
│   │   ├── (dashboard)/       # Rutas del dashboard
│   │   ├── (public)/          # Rutas públicas (Carta QR)
│   │   └── api/               # API Routes de Next.js
│   │
│   ├── components/            # Componentes React
│   │   ├── common/           # Componentes comunes
│   │   ├── layouts/          # Layouts
│   │   ├── modules/          # Por módulo
│   │   └── ui/               # Componentes UI base
│   │
│   ├── hooks/                # Custom hooks
│   ├── services/             # Servicios API
│   ├── store/                # Estado global (Zustand)
│   ├── theme/                # Tema MUI
│   ├── types/                # TypeScript types
│   └── utils/                # Utilidades
│
└── public/                   # Assets estáticos
```

#### Características Frontend
- **SSR/SSG** con Next.js 14
- **Material-UI** para componentes
- **Zustand** para estado global
- **React Query** para cache de datos
- **Socket.io** para tiempo real
- **PWA** para instalación móvil

### 2. Capa de API Gateway

```typescript
backend/src/gateway/
├── middleware/
│   ├── auth.middleware.ts         # JWT validation
│   ├── tenant.middleware.ts       # Tenant resolution
│   ├── rateLimit.middleware.ts    # Rate limiting
│   └── logging.middleware.ts      # Request logging
│
├── routes/
│   ├── index.ts                   # Route aggregation
│   └── [module].routes.ts         # Por módulo
│
└── gateway.ts                     # Main gateway
```

#### Responsabilidades
- ✅ Autenticación y autorización
- ✅ Resolución de tenant
- ✅ Rate limiting por tenant
- ✅ Request/Response logging
- ✅ Error handling global
- ✅ CORS y seguridad

### 3. Capa de Servicios

```typescript
backend/src/services/
├── ventas/
│   ├── ventas.service.ts
│   ├── ventas.controller.ts
│   ├── ventas.repository.ts
│   ├── ventas.validator.ts
│   └── ventas.types.ts
│
├── inventario/
├── cocina/
├── mesas/
├── delivery/
├── marketing/
├── finanzas/
└── ia/
```

#### Patrón de Servicio
```typescript
// Ejemplo: ventas.service.ts
export class VentasService {
  constructor(
    private repository: VentasRepository,
    private eventBus: EventBus,
    private cache: CacheService
  ) {}

  async crearVenta(
    tenantId: string,
    data: CrearVentaDTO
  ): Promise<Venta> {
    // 1. Validar datos
    await this.validator.validate(data);
    
    // 2. Verificar permisos y reglas de negocio
    await this.verificarStock(tenantId, data.items);
    
    // 3. Crear venta
    const venta = await this.repository.crear(tenantId, data);
    
    // 4. Emitir evento
    await this.eventBus.publish('venta.creada', {
      tenantId,
      ventaId: venta.id,
      ...venta
    });
    
    // 5. Invalidar cache
    await this.cache.invalidate(`ventas:${tenantId}`);
    
    return venta;
  }
}
```

### 4. Capa de Datos

#### Prisma Schema (Multitenant)
```prisma
// Modelo base con tenant
model Venta {
  id          String   @id @default(uuid())
  tenantId    String   // ← Multitenant key
  numero      Int
  total       Decimal
  estado      EstadoVenta
  
  // Relaciones
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  items       ItemVenta[]
  cliente     Cliente? @relation(fields: [clienteId], references: [id])
  
  // Auditoría
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  
  // Índices para performance
  @@index([tenantId, createdAt])
  @@index([tenantId, estado])
  @@unique([tenantId, numero])
}
```

#### Repository Pattern
```typescript
export class BaseRepository<T> {
  constructor(
    protected prisma: PrismaClient,
    protected model: string
  ) {}

  async findAll(tenantId: string, filters?: any): Promise<T[]> {
    return this.prisma[this.model].findMany({
      where: {
        tenantId,
        ...filters
      }
    });
  }

  async findById(tenantId: string, id: string): Promise<T | null> {
    return this.prisma[this.model].findFirst({
      where: { id, tenantId }
    });
  }

  async create(tenantId: string, data: any): Promise<T> {
    return this.prisma[this.model].create({
      data: {
        ...data,
        tenantId
      }
    });
  }
}
```

---

## 🔄 Flujo de Datos

### Flujo de Creación de Venta

```
┌─────────┐
│ Cliente │
└────┬────┘
     │ 1. POST /api/ventas
     ▼
┌─────────────────┐
│  API Gateway    │
├─────────────────┤
│ • Valida JWT    │
│ • Extrae tenant │
│ • Rate limit    │
└────┬────────────┘
     │ 2. Request + tenantId
     ▼
┌─────────────────┐
│ Ventas Service  │
├─────────────────┤
│ • Valida datos  │
│ • Verifica stock│
│ • Crea venta    │
└────┬────────────┘
     │ 3. Guardar en DB
     ▼
┌─────────────────┐
│   PostgreSQL    │
│  (con tenantId) │
└────┬────────────┘
     │ 4. Venta creada
     ▼
┌─────────────────┐
│   Event Bus     │
├─────────────────┤
│ venta.creada    │
└────┬────────────┘
     │ 5. Eventos paralelos
     ├──────────────────┬──────────────────┬──────────────────┐
     ▼                  ▼                  ▼                  ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Inventario│    │  Cocina  │    │ Finanzas │    │Analytics │
│ Service  │    │ Service  │    │ Service  │    │ Service  │
├──────────┤    ├──────────┤    ├──────────┤    ├──────────┤
│Actualiza │    │  Crea    │    │Registra  │    │Actualiza │
│  stock   │    │ comanda  │    │ ingreso  │    │métricas  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Flujo de Consulta con Cache

```
Cliente → API Gateway → Cache (Redis)
                           │
                           ├─ HIT → Retorna datos
                           │
                           └─ MISS → Service → DB → Cache → Cliente
```

---

## 🎨 Patrones de Diseño

### 1. Repository Pattern
Abstrae el acceso a datos y facilita testing.

### 2. Service Layer
Lógica de negocio centralizada y reutilizable.

### 3. Event-Driven
Desacoplamiento entre módulos mediante eventos.

### 4. CQRS (Command Query Responsibility Segregation)
Separación de lecturas y escrituras para optimización.

### 5. Dependency Injection
Inversión de control para mejor testabilidad.

### 6. Factory Pattern
Creación de objetos complejos (ej: diferentes tipos de pedidos).

### 7. Strategy Pattern
Diferentes estrategias de cálculo (ej: descuentos, puntos).

### 8. Observer Pattern
Notificaciones y actualizaciones en tiempo real.

---

## 📈 Escalabilidad

### Horizontal Scaling

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└────────┬────────┬────────┬──────────────┘
         │        │        │
    ┌────▼───┐ ┌─▼────┐ ┌─▼────┐
    │ API 1  │ │ API 2│ │ API 3│
    └────┬───┘ └──┬───┘ └──┬───┘
         │        │        │
         └────────┴────────┘
                  │
         ┌────────▼────────┐
         │   PostgreSQL    │
         │   (Primary)     │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼───┐      ┌─────▼──┐
    │Replica1│      │Replica2│
    └────────┘      └────────┘
```

### Caching Strategy

1. **Application Cache** (Redis)
   - Sesiones de usuario
   - Datos de tenant
   - Configuraciones
   - Resultados de queries frecuentes

2. **CDN Cache**
   - Assets estáticos
   - Imágenes de productos
   - Carta QR

3. **Database Cache**
   - Query result cache
   - Materialized views

### Database Sharding

```
Tenant 1-1000   → Shard 1
Tenant 1001-2000 → Shard 2
Tenant 2001-3000 → Shard 3
```

---

## 🔒 Seguridad

### Capas de Seguridad

1. **Network Layer**
   - WAF (Web Application Firewall)
   - DDoS protection
   - SSL/TLS

2. **Application Layer**
   - JWT con rotación
   - RBAC (Role-Based Access Control)
   - Tenant isolation
   - Input validation
   - SQL injection prevention

3. **Data Layer**
   - Encryption at rest
   - Encryption in transit
   - Backup encryption
   - PII masking

---

## 📊 Monitoreo y Observabilidad

### Métricas Clave

```typescript
// Ejemplo de métricas
{
  "requests_per_second": 1500,
  "avg_response_time": "45ms",
  "error_rate": "0.1%",
  "active_tenants": 250,
  "database_connections": 45,
  "cache_hit_rate": "95%",
  "queue_depth": 12
}
```

### Logging

```typescript
// Structured logging
logger.info('Venta creada', {
  tenantId: 'tenant-123',
  ventaId: 'venta-456',
  monto: 1500,
  userId: 'user-789',
  timestamp: new Date(),
  metadata: {
    canal: 'mostrador',
    sucursal: 'principal'
  }
});
```

### Alertas

- CPU > 80%
- Memory > 85%
- Error rate > 1%
- Response time > 1s
- Queue depth > 100
- Failed jobs > 10

---

## 🚀 Próximos Pasos

1. ✅ Revisar [Stack Tecnológico](02-STACK-TECNOLOGICO.md)
2. ✅ Estudiar [Modelo de Datos](03-MODELO-DATOS.md)
3. ✅ Implementar [Multitenant](04-MULTITENANT.md)
4. ✅ Configurar [Estructura del Proyecto](05-ESTRUCTURA-PROYECTO.md)

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024
