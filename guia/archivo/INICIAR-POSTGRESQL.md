# 🔧 CÓMO INICIAR POSTGRESQL

## ❌ Problema Actual

```
Error: Can't reach database server at `localhost:5432`
```

**PostgreSQL no está corriendo** en tu sistema.

---

## 🚀 Soluciones para Iniciar PostgreSQL

### Opción 1: Homebrew (Más Común en Mac)

```bash
# Iniciar PostgreSQL
brew services start postgresql@14

# O si tienes otra versión:
brew services start postgresql@15
brew services start postgresql

# Verificar que está corriendo
brew services list
```

### Opción 2: pg_ctl (Manual)

```bash
# Encontrar dónde está instalado PostgreSQL
which postgres

# Iniciar con pg_ctl
pg_ctl -D /usr/local/var/postgresql@14 start

# O si está en otra ubicación:
pg_ctl -D /usr/local/var/postgres start
pg_ctl -D /opt/homebrew/var/postgresql@14 start
```

### Opción 3: Postgres.app (Si usas la app)

1. Abrir **Postgres.app**
2. Click en **Start**
3. Verificar que el ícono esté verde

### Opción 4: Docker (Si usas Docker)

```bash
# Iniciar contenedor de PostgreSQL
docker start postgres

# O crear uno nuevo:
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14
```

---

## ✅ Verificar que PostgreSQL Está Corriendo

```bash
# Opción 1: Verificar proceso
ps aux | grep postgres

# Opción 2: Intentar conectar
psql -U postgres -h localhost

# Opción 3: Verificar puerto
lsof -i :5432
```

**Deberías ver algo como:**
```
postgres  12345  user  ... localhost:5432
```

---

## 🔍 Encontrar tu Instalación de PostgreSQL

```bash
# Buscar ejecutable de postgres
which postgres

# Buscar directorio de datos
find /usr/local -name "postgresql*" 2>/dev/null
find /opt/homebrew -name "postgresql*" 2>/dev/null

# Ver versiones instaladas con Homebrew
brew list | grep postgres
```

---

## 📋 Pasos Completos

### 1. Iniciar PostgreSQL

```bash
# Intenta este comando primero
brew services start postgresql@14

# Si no funciona, prueba:
brew services start postgresql
```

### 2. Verificar que Inició

```bash
# Deberías ver "started" en verde
brew services list

# O verificar el proceso
ps aux | grep postgres
```

### 3. Probar Conexión

```bash
# Conectar a la base de datos
psql -U postgres -h localhost

# Si funciona, salir con:
\q
```

### 4. Reiniciar Backend

```bash
cd backend
npm run dev
```

### 5. Verificar en el Navegador

Abrir: `http://localhost:3002/dashboard/inventario`

---

## 🐛 Problemas Comunes

### "command not found: brew"

**Solución**: Homebrew no está instalado. Opciones:

1. **Instalar Homebrew**:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Usar pg_ctl directamente**:
   ```bash
   /usr/local/bin/pg_ctl -D /usr/local/var/postgres start
   ```

### "No such file or directory"

**Solución**: PostgreSQL no está instalado. Instalar:

```bash
# Con Homebrew
brew install postgresql@14

# Iniciar después de instalar
brew services start postgresql@14
```

### "Port 5432 already in use"

**Solución**: Otro proceso está usando el puerto.

```bash
# Ver qué está usando el puerto
lsof -i :5432

# Matar el proceso
kill -9 [PID]

# Reiniciar PostgreSQL
brew services restart postgresql@14
```

### "Permission denied"

**Solución**: Problemas de permisos.

```bash
# Cambiar permisos del directorio de datos
sudo chown -R $(whoami) /usr/local/var/postgresql@14

# Reintentar
brew services start postgresql@14
```

---

## 🎯 Después de Iniciar PostgreSQL

Una vez que PostgreSQL esté corriendo:

1. ✅ El backend se conectará automáticamente
2. ✅ Podrás crear productos e ingredientes
3. ✅ El error 500 desaparecerá

---

## 📞 Si Nada Funciona

### Opción 1: Reinstalar PostgreSQL

```bash
# Desinstalar
brew uninstall postgresql@14

# Limpiar
rm -rf /usr/local/var/postgresql@14

# Reinstalar
brew install postgresql@14

# Iniciar
brew services start postgresql@14

# Crear base de datos
createdb gastrodash_dev
```

### Opción 2: Usar Docker

```bash
# Crear contenedor PostgreSQL
docker run --name gastrodash-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gastrodash_dev \
  -p 5432:5432 \
  -d postgres:14

# Verificar que está corriendo
docker ps
```

### Opción 3: Cambiar a SQLite (Temporal)

Modificar `.env` del backend:

```env
# Comentar PostgreSQL
# DATABASE_URL="postgresql://..."

# Usar SQLite
DATABASE_URL="file:./dev.db"
```

Luego:
```bash
cd backend
npx prisma migrate dev
npm run dev
```

---

## 🎉 Checklist

- [ ] PostgreSQL instalado
- [ ] PostgreSQL corriendo (puerto 5432)
- [ ] Puedo conectarme con `psql`
- [ ] Base de datos `gastrodash_dev` existe
- [ ] Backend se conecta sin errores
- [ ] Frontend carga sin error 500

---

**Próximo Paso**: Una vez que PostgreSQL esté corriendo, el sistema funcionará perfectamente! 🚀

---

**Última Actualización**: Diciembre 2024  
**Problema**: PostgreSQL no está corriendo  
**Solución**: Iniciar PostgreSQL con uno de los métodos arriba
