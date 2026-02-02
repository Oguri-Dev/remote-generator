# 🏠 Instalación Local - Sistema Control Generador

Esta guía te ayudará a instalar el sistema como servicio local en Windows sin Docker.

## 📋 Requisitos Previos

### 1. Node.js y PNPM
```powershell
# Instalar Node.js v16 o superior desde: https://nodejs.org/

# Verificar instalación
node --version  # Debe ser >= 16.15.0
npm --version

# Instalar PNPM globalmente
npm install -g pnpm

# Verificar PNPM
pnpm --version
```

### 2. Go (Golang)
```powershell
# Descargar Go 1.24 o superior desde: https://go.dev/dl/

# Verificar instalación
go version  # Debe ser >= 1.24
```

### 3. MongoDB
```powershell
# Opción A: Instalar MongoDB Community Server
# Descargar desde: https://www.mongodb.com/try/download/community

# Opción B: Usar MongoDB Atlas (Cloud - Gratis)
# Ir a: https://www.mongodb.com/cloud/atlas
```

---

## 🚀 Instalación Paso a Paso

### Paso 1: Instalar Dependencias del Frontend

```powershell
cd FrontEnd
pnpm install
```

### Paso 2: Instalar Dependencias del Backend

```powershell
cd ..\BackEnd
go mod download
go mod tidy
```

### Paso 3: Configurar Variables de Entorno

#### Backend (.env)

```powershell
cd BackEnd
Copy-Item .env.example .env
notepad .env
```

Editar con tus valores:
```env
PORT=8099
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=generator
MONGODB_COLL=config
FRONTEND_ORIGIN=http://localhost:3069
ENVIRONMENT=development
```

Si usas MongoDB Atlas, cambia `MONGODB_URI` a tu connection string:
```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### Frontend (.env)

```powershell
cd ..\FrontEnd
Copy-Item .env.example .env
notepad .env
```

Verificar que tenga:
```env
VITE_API_URL=http://localhost:8099
VITE_WS_URL=ws://localhost:8099/ws
```

### Paso 4: Verificar MongoDB

#### Si instalaste MongoDB local:

```powershell
# Iniciar servicio MongoDB (si no está corriendo)
net start MongoDB

# Verificar que esté corriendo
mongosh --eval "db.version()"
```

#### Si usas MongoDB Atlas:
- Asegúrate de haber configurado correctamente el connection string en `.env`
- Verifica que tu IP esté en la lista blanca (Network Access)

---

## ▶️ Ejecutar el Sistema

### Opción 1: Scripts PowerShell (Recomendado)

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```

### Opción 2: Archivos .bat (Doble Click)

1. Doble click en `start-backend.bat`
2. Doble click en `start-frontend.bat`
3. Esperar 30 segundos
4. Abrir navegador en: http://localhost:3069

### Opción 3: Manual

**Terminal 1 - Backend:**
```powershell
cd BackEnd
$env:PORT="8099"
$env:MONGODB_URI="mongodb://localhost:27017"
$env:MONGODB_DB="generator"
$env:MONGODB_COLL="config"
$env:FRONTEND_ORIGIN="http://localhost:3069"
$env:ENVIRONMENT="development"
go run main.go
```

**Terminal 2 - Frontend:**
```powershell
cd FrontEnd
pnpm dev
```

---

## 🔧 Configurar como Servicio de Windows

Para que el sistema se ejecute automáticamente al iniciar Windows, puedes usar NSSM (Non-Sucking Service Manager).

### Instalar NSSM

```powershell
# Opción A: Descargar manualmente
# https://nssm.cc/download

# Opción B: Con Chocolatey
choco install nssm

# Opción C: Con Scoop
scoop install nssm
```

### Crear Servicio para Backend

```powershell
# Compilar el backend primero
cd BackEnd
go build -o generator-backend.exe main.go

# Crear servicio con NSSM
nssm install GeneradorBackend "F:\vscode\proyecto-generador\remote-generator\BackEnd\generator-backend.exe"

# Configurar directorio de trabajo
nssm set GeneradorBackend AppDirectory "F:\vscode\proyecto-generador\remote-generator\BackEnd"

# Configurar variables de entorno
nssm set GeneradorBackend AppEnvironmentExtra ^
    PORT=8099 ^
    MONGODB_URI=mongodb://localhost:27017 ^
    MONGODB_DB=generator ^
    MONGODB_COLL=config ^
    FRONTEND_ORIGIN=http://localhost:3069 ^
    ENVIRONMENT=production

# Configurar para que inicie automáticamente
nssm set GeneradorBackend Start SERVICE_AUTO_START

# Iniciar el servicio
nssm start GeneradorBackend
```

### Crear Servicio para Frontend (Producción)

Para frontend en producción, primero necesitas compilar:

```powershell
cd FrontEnd
pnpm build

# Instalar servidor HTTP estático (serve)
npm install -g serve

# Crear servicio con NSSM
nssm install GeneradorFrontend "C:\Users\TuUsuario\AppData\Roaming\npm\serve.cmd"
nssm set GeneradorFrontend AppParameters "-s dist -l 3069"
nssm set GeneradorFrontend AppDirectory "F:\vscode\proyecto-generador\remote-generator\FrontEnd"
nssm set GeneradorFrontend Start SERVICE_AUTO_START

# Iniciar el servicio
nssm start GeneradorFrontend
```

### Gestionar Servicios

```powershell
# Ver estado
nssm status GeneradorBackend
nssm status GeneradorFrontend

# Detener servicios
nssm stop GeneradorBackend
nssm stop GeneradorFrontend

# Reiniciar servicios
nssm restart GeneradorBackend
nssm restart GeneradorFrontend

# Eliminar servicios
nssm remove GeneradorBackend confirm
nssm remove GeneradorFrontend confirm
```

---

## 📝 Scripts de Gestión Automática

También he creado scripts PowerShell para gestionar los servicios fácilmente.

### install-service.ps1 - Instalar servicios

```powershell
.\install-service.ps1
```

### start-services.ps1 - Iniciar servicios

```powershell
.\start-services.ps1
```

### stop-services.ps1 - Detener servicios

```powershell
.\stop-services.ps1
```

---

## ✅ Verificación

### 1. Verificar Backend
```powershell
# Debe responder con datos de configuración
curl http://localhost:8099/api/config
```

### 2. Verificar Frontend
```powershell
# Abrir en navegador
start http://localhost:3069
```

### 3. Verificar Servicios (si instalaste servicios)
```powershell
Get-Service | Where-Object {$_.Name -like "Generador*"}
```

---

## 🔍 Solución de Problemas

### Error: "MongoDB connection failed"

**Solución:**
```powershell
# Verificar que MongoDB esté corriendo
net start MongoDB

# O verificar el connection string si usas Atlas
```

### Error: "Port 8099 already in use"

**Solución:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :8099

# Matar el proceso (reemplaza <PID> con el número que aparece)
taskkill /PID <PID> /F
```

### Error: "pnpm: command not found"

**Solución:**
```powershell
npm install -g pnpm
```

### Error: "go: command not found"

**Solución:**
- Instalar Go desde https://go.dev/dl/
- Reiniciar terminal después de instalación

---

## 📊 Monitoreo de Logs

### Logs del Backend
```powershell
# Si corre como servicio
nssm status GeneradorBackend

# Logs están en el directorio del backend
Get-Content BackEnd\logs\app.log -Wait -Tail 50
```

### Logs del Frontend
```powershell
# Logs del navegador (F12 > Console)
```

---

## 🔄 Actualización del Sistema

```powershell
# Detener servicios
nssm stop GeneradorBackend
nssm stop GeneradorFrontend

# Actualizar código (git pull o descargar nuevo código)
git pull

# Reinstalar dependencias si es necesario
cd BackEnd
go mod download
cd ..\FrontEnd
pnpm install

# Recompilar backend
cd ..\BackEnd
go build -o generator-backend.exe main.go

# Recompilar frontend
cd ..\FrontEnd
pnpm build

# Reiniciar servicios
nssm start GeneradorBackend
nssm start GeneradorFrontend
```

---

## 🎯 Configuración Inicial

1. Abrir http://localhost:3069
2. En primera ejecución verás "Configuración Inicial"
3. Configurar datos de la placa MQTT Dingtian:
   - IP de la placa
   - Puerto MQTT (default: 1883)
   - Topic base
4. Guardar configuración
5. El sistema intentará conectar con la placa

---

## 🔐 Seguridad en Producción

Si expones el sistema a Internet:

1. **Cambiar a HTTPS**: Usar nginx o IIS como reverse proxy
2. **Firewall**: Abrir solo los puertos necesarios
3. **Autenticación**: El sistema ya incluye login
4. **MongoDB**: Configurar usuario y contraseña
5. **Actualizar CORS**: En backend `.env` cambiar `FRONTEND_ORIGIN`

---

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs del backend
2. Console del navegador (F12)
3. Estado de MongoDB
4. Configuración de .env files
