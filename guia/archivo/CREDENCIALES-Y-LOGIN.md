# 🔐 Sistema de Login Completo

## ✅ Estado Actual

El sistema de login está **100% funcional** en:
- ✅ Base de datos (PostgreSQL)
- ✅ Backend (API REST)
- ✅ Frontend (UI con MUI)

## 👥 Usuarios Disponibles

### 1. Usuario Admin
- **Email**: `admin@demo.com`
- **Password**: `admin123`
- **Rol**: ADMIN
- **Permisos**: Acceso completo al sistema

### 2. Usuario Demo
- **Email**: `demo@gastrodash.com`
- **Password**: `demo123`
- **Rol**: CAJERO
- **Permisos**: Ventas, consultas básicas

## 🚀 Cómo Probar el Login

### Opción 1: Login Manual
1. Abre http://localhost:3002
2. Ve a la página de Login
3. Ingresa email y contraseña
4. Click en "Iniciar Sesión"

### Opción 2: Login Rápido (Nuevo)
1. Abre http://localhost:3002/auth/login
2. Verás botones de "Login Rápido"
3. Click en "👤 Admin" o "👤 Demo"
4. ¡Acceso instantáneo!

### Opción 3: API (cURL)

#### Login como Admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "admin123"
  }'
```

#### Login como Demo
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@gastrodash.com",
    "password": "demo123"
  }'
```

## 📊 Respuesta del Login

Cuando haces login exitoso, recibes:

```json
{
  "user": {
    "id": "uuid-del-usuario",
    "nombre": "Admin",
    "apellido": "Demo",
    "email": "admin@demo.com",
    "rol": "ADMIN"
  },
  "tenant": {
    "id": "uuid-del-tenant",
    "nombre": "Restaurante Demo",
    "slug": "demo"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔑 Token JWT

El token incluye:
- `userId`: ID del usuario
- `tenantId`: ID del negocio
- `email`: Email del usuario
- `rol`: Rol del usuario
- `exp`: Fecha de expiración (7 días)

## 🎯 Flujo Completo de Autenticación

```
┌─────────────────────────────────────────────────┐
│ 1. Usuario ingresa email y password            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. Frontend envía POST /api/auth/login         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Backend busca usuario en PostgreSQL         │
│    - Verifica email existe                      │
│    - Verifica usuario activo                    │
│    - Verifica tenant activo                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 4. Backend valida password con bcrypt          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 5. Backend genera JWT con datos del usuario    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 6. Frontend guarda token en localStorage       │
│    - Guarda datos en Zustand                    │
│    - Redirige a /dashboard                      │
└─────────────────────────────────────────────────┘
```

## 🗄️ Base de Datos

### Tabla Usuario

```sql
SELECT 
  email, 
  nombre, 
  apellido, 
  rol, 
  activo 
FROM "Usuario";
```

Resultado:
```
email                  | nombre  | apellido | rol    | activo
-----------------------|---------|----------|--------|--------
admin@demo.com         | Admin   | Demo     | ADMIN  | true
demo@gastrodash.com    | Usuario | Demo     | CAJERO | true
```

### Ver en Prisma Studio

1. Abre http://localhost:5555
2. Click en "Usuario"
3. Verás ambos usuarios con todos sus datos

## 🔒 Seguridad Implementada

### Passwords
- ✅ Hasheados con bcrypt (10 rounds)
- ✅ Nunca se retornan en las respuestas
- ✅ Validación de longitud mínima

### JWT
- ✅ Firmado con secret key
- ✅ Expiración de 7 días
- ✅ Incluye tenantId para multitenant
- ✅ Validado en cada request protegido

### Validación
- ✅ Email válido (Zod)
- ✅ Password requerido
- ✅ Usuario debe estar activo
- ✅ Tenant debe estar activo

## 🧪 Probar Diferentes Escenarios

### Login Exitoso
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "admin123"}'
```
✅ Retorna token y datos del usuario

### Email Incorrecto
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "noexiste@demo.com", "password": "admin123"}'
```
❌ Error: "Email o contraseña incorrectos"

### Password Incorrecta
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "wrong"}'
```
❌ Error: "Email o contraseña incorrectos"

### Email Inválido
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail", "password": "admin123"}'
```
❌ Error de validación Zod

## 📱 Frontend - Características

### Página de Login
- ✅ Formulario con email y password
- ✅ Validación en tiempo real
- ✅ Mensajes de error claros
- ✅ Loading states
- ✅ Botones de login rápido
- ✅ Credenciales visibles para pruebas
- ✅ Responsive design

### Protección de Rutas
- ✅ Rutas protegidas requieren token
- ✅ Redirección automática a login si no hay token
- ✅ Logout limpia el token

### Persistencia
- ✅ Token guardado en localStorage
- ✅ Sesión persiste al recargar página
- ✅ Logout limpia todo

## 🎨 UI del Login

La página de login incluye:

1. **Header**
   - Logo/Título "GastroDash Pro"
   - Subtítulo descriptivo

2. **Login Rápido** (Nuevo)
   - Botón "👤 Admin" - Login instantáneo como admin
   - Botón "👤 Demo" - Login instantáneo como demo

3. **Formulario Manual**
   - Campo Email
   - Campo Password
   - Botón "Iniciar Sesión"

4. **Link a Registro**
   - "¿No tienes cuenta? Regístrate aquí"

## 🔄 Crear Más Usuarios

### Opción 1: Desde el Frontend
1. Ve a http://localhost:3002/auth/register
2. Completa el formulario
3. Se creará un nuevo tenant + usuario admin

### Opción 2: Desde Prisma Studio
1. Abre http://localhost:5555
2. Click en "Usuario"
3. Click en "Add record"
4. Completa los campos (recuerda hashear el password)

### Opción 3: Desde SQL
```sql
-- Primero hashea la password con bcrypt
-- Luego inserta el usuario

INSERT INTO "Usuario" (
  id, 
  "tenantId", 
  email, 
  password, 
  nombre, 
  apellido, 
  rol, 
  activo
) VALUES (
  gen_random_uuid(),
  'id-del-tenant',
  'nuevo@example.com',
  '$2a$10$hashedpassword...',
  'Nuevo',
  'Usuario',
  'CAJERO',
  true
);
```

## 📝 Roles Disponibles

```typescript
enum RolUsuario {
  SUPER_ADMIN  // Acceso total al sistema
  ADMIN        // Administrador del tenant
  GERENTE      // Gestión y reportes
  CAJERO       // Ventas y caja
  MESERO       // Atención de mesas
  COCINERO     // Cocina y preparación
  CADETE       // Delivery
}
```

## 🎯 Próximos Pasos

Ahora que el login está completo:

1. ✅ Probar login con ambos usuarios
2. ⏳ Crear módulo de Productos (CRUD)
3. ⏳ Crear módulo de Clientes (CRUD)
4. ⏳ Implementar sistema de permisos por rol
5. ⏳ Crear módulo de Ventas (POS)

## 🐛 Troubleshooting

### "Email o contraseña incorrectos"
- Verifica que estés usando las credenciales correctas
- Verifica que el usuario exista en la BD
- Verifica que el usuario esté activo

### "Tu cuenta está inactiva"
- El usuario o el tenant está marcado como inactivo
- Actívalo desde Prisma Studio

### "Token inválido"
- El token expiró (7 días)
- Haz logout y vuelve a hacer login

### No redirige al dashboard
- Verifica que el frontend esté corriendo
- Abre la consola del navegador para ver errores
- Verifica que el token se guardó en localStorage

---

**Estado**: ✅ Sistema de login 100% funcional  
**Usuarios**: 2 (Admin + Demo)  
**Próximo**: Módulos de negocio (Productos, Clientes, Ventas)  
**Fecha**: Diciembre 2024
