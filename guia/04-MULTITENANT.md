# 🏢 Estrategia Multitenant - GastroDash Pro

## 📋 Tabla de Contenidos
- [Concepto de Multitenant](#concepto-de-multitenant)
- [Arquitectura Multitenant](#arquitectura-multitenant)
- [Implementación en Base de Datos](#implementación-en-base-de-datos)
- [Implementación en Backend](#implementación-en-backend)
- [Implementación en Frontend](#implementación-en-frontend)
- [Seguridad y Aislamiento](#seguridad-y-aislamiento)

---

## 🎯 Concepto de Multitenant

### ¿Qué es Multitenant?

Un sistema **multitenant** permite que múltiples clientes (tenants) compartan la misma infraestructura y aplicación, pero con **datos completamente aislados**.

```
┌─────────────────────────────────────────────────┐
│           GastroDash Pro (Aplicación)           │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Tenant A │  │ Tenant B │  │ Tenant C │      │
│  │ (Pizza   │  │ (Burger  │  │ (Sushi   │      │
│  │  House)  │  │  King)   │  │  Bar)    │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│       │             │             │              │
│       ▼             ▼             ▼              │
│  ┌────────────────────────────────────┐         │
│  │    Base de Datos Compartida        │         │
│  │  (con tenantId en cada registro)   │         │
│  └────────────────────────────────────┘         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Beneficios

✅ **Eficiencia de costos**: Una sola infraestructura para todos  
✅ **Mantenimiento simplificado**: Un solo código base  
✅ **Escalabilidad**: Agregar clientes sin cambios arquitectónicos  
✅ **Actualizaciones centralizadas**: Deploy una vez para todos  

### Requisitos Críticos

🔒 **Aislamiento total de datos**: Tenant A NUNCA puede ver datos de Tenant B  
🔒 **Seguridad por diseño**: Validación en cada capa  
🔒 **Performance**: No degradación con muchos tenants  
🔒 **Configuración por tenant**: Cada cliente puede personalizar  

---

## 🏗️ Arquitectura Multitenant

### Estrategia: Shared Database, Shared Schema

Usaremos una **base de datos compartida** con un **esquema compartido**, donde cada tabla tiene una columna `tenantId`.

```sql
-- Ejemplo de tabla multitenant
CREATE TABLE ventas (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,  -- ← Clave multitenant
    numero INTEGER NOT NULL,
    total DECIMAL(10,2),
    created_at TIMESTAMP,
    
    -- Índice compuesto para performance
    CONSTRAINT unique_numero_per_tenant 
        UNIQUE (tenant_id, numero)
);

-- Índice para queries rápidas
CREATE INDEX idx_ventas_tenant 
    ON ventas(tenant_id, created_at DESC);
```

### Alternativas Consideradas

| Estrategia | Pros | Contras | Decisión |
|------------|------|---------|----------|
| **Shared DB + Shared Schema** ✅ | Simple, eficiente, escalable | Requiere disciplina | **ELEGIDO** |
| Shared DB + Schema per Tenant | Aislamiento fuerte | Complejo, migraciones difíciles | No |
| Database per Tenant | Máximo aislamiento | Muy costoso, difícil de mantener | No |

---

## 💾 Implementación en Base de Datos

### Modelo Tenant

```prisma
// prisma/schema.prisma

model Tenant {
  id        String   @id @default(uuid())
  nombre    String
  slug      String   @unique  // ej: "pizza-house"
  dominio   String?  @unique  // ej: "pizzahouse.gastrodash.com"
  
  // Configuración
  configuracion Json
  plan          String   // free, basic, premium, enterprise
  activo        Boolean  @default(true)
  
  // Límites
  maxUsuarios   Int      @default(10)
  maxSucursales Int      @default(1)
  
  // Auditoría
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relaciones
  usuarios      Usuario[]
  ventas        Venta[]
  productos     Producto[]
  clientes      Cliente[]
  // ... todas las demás entidades
  
  @@index([slug])
  @@index([activo])
}
```

### Modelos con Multitenant

```prisma
model Usuario {
  id        String   @id @default(uuid())
  tenantId  String   // ← Multitenant key
  
  email     String
  nombre    String
  apellido  String
  rol       RolUsuario
  activo    Boolean  @default(true)
  
  // Relación con tenant
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  // Auditoría
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Índices para performance y seguridad
  @@unique([tenantId, email])  // Email único por tenant
  @@index([tenantId, activo])
}

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
  
  // Índices
  @@unique([tenantId, numero])  // Número único por tenant
  @@index([tenantId, createdAt])
  @@index([tenantId, estado])
}

model Producto {
  id          String   @id @default(uuid())
  tenantId    String   // ← Multitenant key
  
  nombre      String
  precio      Decimal
  disponible  Boolean  @default(true)
  
  // Relación
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  // Índices
  @@index([tenantId, disponible])
  @@index([tenantId, nombre])
}
```

### Row-Level Security (RLS) en PostgreSQL

```sql
-- Habilitar RLS
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Política: Solo ver datos del propio tenant
CREATE POLICY tenant_isolation_policy ON ventas
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Política para INSERT
CREATE POLICY tenant_insert_policy ON ventas
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## ⚙️ Implementación en Backend

### Middleware de Tenant

```typescript
// backend/src/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

export interface TenantRequest extends Request {
  tenantId: string;
  tenant: Tenant;
}

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Extraer tenant del token JWT
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ 
        error: 'Tenant no identificado' 
      });
    }
    
    // 2. Verificar que el tenant existe y está activo
    const prisma = new PrismaClient();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    if (!tenant || !tenant.activo) {
      return res.status(403).json({ 
        error: 'Tenant inactivo o no encontrado' 
      });
    }
    
    // 3. Inyectar tenantId en el request
    (req as TenantRequest).tenantId = tenantId;
    (req as TenantRequest).tenant = tenant;
    
    // 4. Configurar tenant en Prisma (para RLS)
    await prisma.$executeRaw`
      SELECT set_config('app.current_tenant', ${tenantId}, true)
    `;
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error en tenant middleware' });
  }
}
```

### Repository Base con Multitenant

```typescript
// backend/src/repositories/base.repository.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(
    protected prisma: PrismaClient,
    protected model: string
  ) {}

  async findAll(tenantId: string, filters?: any): Promise<T[]> {
    return this.prisma[this.model].findMany({
      where: {
        tenantId,  // ← SIEMPRE filtrar por tenant
        ...filters
      }
    });
  }

  async findById(tenantId: string, id: string): Promise<T | null> {
    return this.prisma[this.model].findFirst({
      where: { 
        id, 
        tenantId  // ← CRÍTICO: validar tenant
      }
    });
  }

  async create(tenantId: string, data: any): Promise<T> {
    return this.prisma[this.model].create({
      data: {
        ...data,
        tenantId  // ← SIEMPRE incluir tenantId
      }
    });
  }

  async update(
    tenantId: string, 
    id: string, 
    data: any
  ): Promise<T | null> {
    // Primero verificar que el registro pertenece al tenant
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      throw new Error('Registro no encontrado o no pertenece al tenant');
    }

    return this.prisma[this.model].update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      return false;
    }

    await this.prisma[this.model].delete({
      where: { id }
    });
    
    return true;
  }
}
```

### Service con Multitenant

```typescript
// backend/src/services/ventas.service.ts
export class VentasService {
  constructor(
    private repository: VentasRepository,
    private productosRepository: ProductosRepository
  ) {}

  async crearVenta(
    tenantId: string,  // ← SIEMPRE recibir tenantId
    userId: string,
    data: CrearVentaDTO
  ): Promise<Venta> {
    // 1. Validar que los productos pertenecen al tenant
    for (const item of data.items) {
      const producto = await this.productosRepository.findById(
        tenantId,  // ← Validar tenant
        item.productoId
      );
      
      if (!producto) {
        throw new Error(
          `Producto ${item.productoId} no encontrado en este tenant`
        );
      }
    }

    // 2. Crear venta con tenantId
    const venta = await this.repository.create(tenantId, {
      ...data,
      createdBy: userId
    });

    return venta;
  }

  async obtenerVentas(
    tenantId: string,
    filters?: VentasFilters
  ): Promise<Venta[]> {
    // Solo retorna ventas del tenant
    return this.repository.findAll(tenantId, filters);
  }
}
```

### Controller con Multitenant

```typescript
// backend/src/controllers/ventas.controller.ts
export class VentasController {
  constructor(private service: VentasService) {}

  async crear(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId;  // ← Del middleware
      const userId = req.user!.id;
      const data = req.body;

      const venta = await this.service.crearVenta(
        tenantId,  // ← Pasar tenantId
        userId,
        data
      );

      res.status(201).json(venta);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async listar(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId;  // ← Del middleware
      const filters = req.query;

      const ventas = await this.service.obtenerVentas(
        tenantId,  // ← Pasar tenantId
        filters
      );

      res.json(ventas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

## 🎨 Implementación en Frontend

### Tenant Context

```typescript
// frontend/src/contexts/TenantContext.tsx
import { createContext, useContext, ReactNode } from 'react';

interface TenantContextType {
  tenantId: string;
  tenant: Tenant;
  configuracion: TenantConfig;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  
  const tenantId = user?.tenantId || '';
  const tenant = user?.tenant || null;
  const configuracion = tenant?.configuracion || {};

  return (
    <TenantContext.Provider value={{ tenantId, tenant, configuracion }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe usarse dentro de TenantProvider');
  }
  return context;
}
```

### API Client con Tenant

```typescript
// frontend/src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Interceptor para agregar token (que incluye tenantId)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de tenant
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Tenant inactivo o no autorizado
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Componente con Tenant

```typescript
// frontend/src/components/VentasList.tsx
import { useTenant } from '@/contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function VentasList() {
  const { tenantId } = useTenant();

  const { data: ventas, isLoading } = useQuery({
    queryKey: ['ventas', tenantId],  // ← Cache por tenant
    queryFn: async () => {
      const response = await api.get('/ventas');
      return response.data;
    },
  });

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Ventas</h2>
      {ventas?.map((venta) => (
        <div key={venta.id}>
          Venta #{venta.numero} - ${venta.total}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔒 Seguridad y Aislamiento

### Checklist de Seguridad Multitenant

#### Base de Datos
- ✅ Todas las tablas tienen `tenantId`
- ✅ Índices compuestos con `tenantId`
- ✅ Constraints únicos incluyen `tenantId`
- ✅ Row-Level Security habilitado
- ✅ Backups separados por tenant (opcional)

#### Backend
- ✅ Middleware valida tenant en cada request
- ✅ Repositories siempre filtran por `tenantId`
- ✅ Services reciben `tenantId` como parámetro
- ✅ Controllers extraen `tenantId` del request
- ✅ Tests verifican aislamiento de datos

#### Frontend
- ✅ Token JWT incluye `tenantId`
- ✅ Cache de React Query incluye `tenantId`
- ✅ Logout si tenant inactivo
- ✅ UI muestra nombre del tenant

### Tests de Aislamiento

```typescript
// backend/tests/multitenant.test.ts
describe('Multitenant Isolation', () => {
  it('tenant A no puede ver datos de tenant B', async () => {
    // Crear venta para tenant A
    const ventaA = await ventasService.crearVenta(
      'tenant-a',
      'user-a',
      { total: 100 }
    );

    // Intentar obtener venta de tenant A usando tenant B
    const ventas = await ventasService.obtenerVentas('tenant-b');

    // No debe incluir la venta de tenant A
    expect(ventas).not.toContainEqual(
      expect.objectContaining({ id: ventaA.id })
    );
  });

  it('no permite actualizar datos de otro tenant', async () => {
    const ventaA = await ventasService.crearVenta(
      'tenant-a',
      'user-a',
      { total: 100 }
    );

    // Intentar actualizar desde tenant B
    await expect(
      ventasService.actualizarVenta(
        'tenant-b',  // ← Tenant diferente
        ventaA.id,
        { total: 200 }
      )
    ).rejects.toThrow('no pertenece al tenant');
  });
});
```

---

## 📊 Monitoreo Multitenant

### Métricas por Tenant

```typescript
// Ejemplo de métricas
{
  "tenant_id": "tenant-123",
  "metrics": {
    "active_users": 15,
    "daily_sales": 45000,
    "api_calls_today": 12500,
    "storage_used_mb": 250,
    "database_queries": 8500
  }
}
```

### Alertas

- ⚠️ Tenant excede límite de usuarios
- ⚠️ Tenant excede límite de API calls
- ⚠️ Tenant con alto uso de recursos
- ⚠️ Tenant inactivo por 30 días

---

## 🚀 Próximos Pasos

1. ✅ Revisar [Estructura del Proyecto](05-ESTRUCTURA-PROYECTO.md)
2. ✅ Implementar [Setup Inicial](06-SETUP-INICIAL.md)
3. ✅ Configurar [Migración a MUI](07-MIGRACION-MUI.md)

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024
