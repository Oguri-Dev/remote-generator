# 🚀 Guía Rápida de Instalación Local (Sin Docker)

## ⚡ Para usuarios que no pueden usar Docker

Este proyecto está adaptado para instalarse localmente en Windows sin necesidad de Docker ni virtualización.

---

## 📋 Paso 1: Verificar Requisitos

Ejecuta este script para verificar que tienes todo instalado:

```powershell
.\check-requirements.ps1
```

Si falta algo, el script te dirá qué instalar y desde dónde.

**Requisitos necesarios:**
- ✅ Node.js v16+
- ✅ PNPM
- ✅ Go 1.24+
- ✅ MongoDB (local o Atlas cloud)

---

## 🔧 Paso 2: Configuración Inicial

### Backend - Configurar .env

```powershell
cd BackEnd
Copy-Item .env.example .env
notepad .env
```

**Para MongoDB local:**
```env
PORT=8099
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=generator
MONGODB_COLL=config
FRONTEND_ORIGIN=http://localhost:3069
ENVIRONMENT=development
```

**Para MongoDB Atlas (cloud - gratis):**
```env
PORT=8099
MONGODB_URI=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=generator
MONGODB_COLL=config
FRONTEND_ORIGIN=http://localhost:3069
ENVIRONMENT=development
```

### Frontend - Verificar .env

```powershell
cd ..\FrontEnd
Copy-Item .env.example .env
# Por defecto ya debería estar OK
```

---

## 📦 Paso 3: Instalar Dependencias

### Backend
```powershell
cd BackEnd
go mod download
go mod tidy
```

### Frontend
```powershell
cd ..\FrontEnd
pnpm install
```

---

## ▶️ Paso 4: Ejecutar el Sistema

### Opción A: Scripts PowerShell (Recomendado)

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```

### Opción B: Archivos .bat (Doble Click)

1. Doble click en `start-backend.bat`
2. Doble click en `start-frontend.bat`
3. Abrir navegador: http://localhost:3069

---

## 🔧 Paso 5: Instalar como Servicio (Opcional)

Si quieres que el sistema se inicie automáticamente con Windows:

### 1. Instalar NSSM

```powershell
# Con Chocolatey
choco install nssm

# O con Scoop
scoop install nssm

# O descargar manualmente de: https://nssm.cc/download
```

### 2. Ejecutar instalador (como Administrador)

```powershell
.\install-service.ps1
```

Este script:
- ✅ Compila el backend
- ✅ Compila el frontend
- ✅ Instala ambos como servicios de Windows
- ✅ Los configura para inicio automático
- ✅ Los inicia

### 3. Gestionar servicios

```powershell
# Ver estado
.\start-services.ps1 status

# Iniciar servicios
.\start-services.ps1

# Detener servicios
.\stop-services.ps1

# Desinstalar servicios
.\uninstall-service.ps1
```

---

## ✅ Verificación

### 1. Backend debe mostrar:
```
🚀 Iniciando servidor...
📍 Puerto configurado: 8099
✅ MongoDB y configuración inicializados
✅ WebSocket Hub creado
✅ Cliente MQTT inicializado
✅ Servidor HTTP escuchando en puerto 8099
```

### 2. Frontend debe mostrar:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:3069/
➜  Network: http://192.168.x.x:3069/
```

### 3. Navegador:
- Abrir: http://localhost:3069
- Debería mostrar pantalla de login o configuración inicial

---

## 🔍 Solución de Problemas Comunes

### MongoDB no conecta

**Si usas MongoDB local:**
```powershell
# Verificar que esté corriendo
net start MongoDB

# O iniciar manualmente
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Si usas MongoDB Atlas:**
- Verifica el connection string
- Asegúrate de que tu IP esté en Network Access (whitelist)

### Puerto 8099 ya en uso
```powershell
# Ver qué proceso lo usa
netstat -ano | findstr :8099

# Matar el proceso (reemplaza <PID>)
taskkill /PID <PID> /F
```

### Error: "pnpm: command not found"
```powershell
npm install -g pnpm
```

### Error al compilar backend
```powershell
cd BackEnd
go clean
go mod tidy
go mod download
go build main.go
```

---

## 📊 Monitoreo

### Logs del Backend
```powershell
# Si corre en terminal, verás los logs directamente

# Si corre como servicio:
nssm status GeneradorBackend
```

### Logs del Frontend
- Abrir DevTools del navegador (F12)
- Ver pestaña Console

---

## 🔄 Actualizar el Sistema

```powershell
# Si usas servicios, detenerlos primero
.\stop-services.ps1

# Actualizar código (git pull o descargar nuevo)
git pull

# Reinstalar dependencias si hay cambios
cd BackEnd
go mod download

cd ..\FrontEnd
pnpm install

# Si usas servicios, reinstalar
.\install-service.ps1

# Si no, simplemente reiniciar backend y frontend
```

---

## 📚 Documentación Adicional

- [INSTALACION-LOCAL.md](INSTALACION-LOCAL.md) - Guía completa y detallada
- [README.md](README.md) - Documentación del proyecto
- [INICIO-RAPIDO.md](INICIO-RAPIDO.md) - Guía de inicio rápido general

---

## ❓ ¿Necesitas Ayuda?

1. Ejecuta `.\check-requirements.ps1` para verificar requisitos
2. Revisa los logs del backend y frontend
3. Verifica la consola del navegador (F12)
4. Asegúrate de que MongoDB esté corriendo
5. Verifica que los archivos .env estén configurados correctamente

---

## 🎯 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3069 | Interfaz web |
| Backend API | http://localhost:8099/api | API REST |
| WebSocket | ws://localhost:8099/ws | Comunicación en tiempo real |
| MongoDB | mongodb://localhost:27017 | Base de datos local |

---

## 🎉 ¡Listo!

Una vez que todo esté corriendo, podrás:
- ✅ Controlar el generador remotamente
- ✅ Ver el estado en tiempo real
- ✅ Consultar historial de activaciones
- ✅ Exportar reportes a PDF
- ✅ Configurar la placa MQTT

**¡Disfruta del sistema!** 🚀
