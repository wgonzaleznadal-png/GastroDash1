# 🔧 Solución: Error de CORS

## ❌ El Error

```
Access to XMLHttpRequest at 'http://localhost:3001/api/auth/login' 
from origin 'http://localhost:3002' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 
'http://localhost:3000' that is not equal to the supplied origin.
```

## 🤔 ¿Qué Significa?

**CORS** (Cross-Origin Resource Sharing) es una política de seguridad del navegador que bloquea requests entre diferentes orígenes (dominios, puertos, protocolos).

En nuestro caso:
- **Frontend**: http://localhost:3002 (origen)
- **Backend**: http://localhost:3001 (destino)
- **Problema**: El backend solo aceptaba requests desde http://localhost:3000

## ✅ La Solución

Configuramos el backend para aceptar requests desde **múltiples orígenes**:

### Archivo: `backend/src/index.ts`

```typescript
// CORS para Express
app.use(cors({ 
  origin: [
    'http://localhost:3000',  // Puerto original
    'http://localhost:3002',  // Puerto actual del frontend
    process.env.CORS_ORIGIN || 'http://localhost:3000'
  ],
  credentials: true 
}));

// CORS para Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      process.env.CORS_ORIGIN || 'http://localhost:3000'
    ],
    credentials: true,
  },
});
```

## 🔄 Cambios Realizados

1. ✅ Configurado CORS en Express para aceptar múltiples orígenes
2. ✅ Configurado CORS en Socket.io para aceptar múltiples orígenes
3. ✅ Reiniciado el backend para aplicar cambios

## 🧪 Verificar que Funciona

### Opción 1: Desde el Frontend
1. Abre http://localhost:3002/auth/login
2. Click en "👤 Admin" o "👤 Demo"
3. Debería funcionar sin errores de CORS

### Opción 2: Desde la Consola del Navegador
```javascript
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@demo.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log)
```

Debería retornar el token y los datos del usuario.

## 📚 Conceptos Clave

### ¿Qué es un "Origen"?

Un origen se compone de:
- **Protocolo**: http:// o https://
- **Dominio**: localhost, example.com, etc.
- **Puerto**: :3000, :3001, :3002, etc.

Ejemplos de orígenes **diferentes**:
- http://localhost:3000 ≠ http://localhost:3001 (puerto diferente)
- http://localhost:3000 ≠ https://localhost:3000 (protocolo diferente)
- http://localhost:3000 ≠ http://example.com:3000 (dominio diferente)

### ¿Por qué existe CORS?

CORS es una medida de seguridad para prevenir:
- Ataques CSRF (Cross-Site Request Forgery)
- Robo de datos sensibles
- Requests maliciosos desde sitios no autorizados

### Preflight Request

El navegador envía un request OPTIONS antes del request real para verificar si el servidor permite el origen. Esto se llama "preflight request".

```
OPTIONS /api/auth/login HTTP/1.1
Origin: http://localhost:3002
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

El servidor debe responder:
```
Access-Control-Allow-Origin: http://localhost:3002
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: content-type
```

## 🔒 Seguridad en Producción

En producción, **NO** uses `*` (todos los orígenes):

```typescript
// ❌ MAL - Permite cualquier origen
app.use(cors({ origin: '*' }));

// ✅ BIEN - Solo orígenes específicos
app.use(cors({ 
  origin: [
    'https://tudominio.com',
    'https://www.tudominio.com'
  ],
  credentials: true 
}));
```

## 🛠️ Configuración Dinámica

Para diferentes entornos:

```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://tudominio.com']
  : ['http://localhost:3000', 'http://localhost:3002'];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
```

## 📝 Variables de Entorno

En `backend/.env`:

```bash
# Desarrollo
CORS_ORIGIN=http://localhost:3002

# Producción
CORS_ORIGIN=https://tudominio.com
```

## 🐛 Otros Errores Comunes de CORS

### "No 'Access-Control-Allow-Origin' header"
- El servidor no tiene CORS configurado
- Solución: Agregar `app.use(cors())`

### "Credentials flag is true, but Access-Control-Allow-Credentials is false"
- Falta `credentials: true` en la configuración
- Solución: Agregar `credentials: true`

### "Method not allowed"
- El método HTTP no está permitido
- Solución: Agregar el método en `Access-Control-Allow-Methods`

## ✅ Checklist de Verificación

- [x] CORS configurado en Express
- [x] CORS configurado en Socket.io
- [x] Múltiples orígenes permitidos (3000 y 3002)
- [x] `credentials: true` configurado
- [x] Backend reiniciado
- [ ] Probar login desde el frontend
- [ ] Verificar en consola del navegador (sin errores)

## 🎯 Resultado

Ahora el frontend (puerto 3002) puede comunicarse sin problemas con el backend (puerto 3001). El login debería funcionar perfectamente.

---

**Estado**: ✅ CORS configurado correctamente  
**Próximo**: Probar login y continuar con módulos  
**Fecha**: Diciembre 2024
