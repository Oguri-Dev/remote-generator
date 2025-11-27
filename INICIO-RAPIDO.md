# 🚀 Inicio Rápido - Sistema Control Generador

## ⚡ Método Rápido (Windows)

### Opción 1: Doble Click (Archivos .bat)

1. **Abrir 2 ventanas del Explorador de Windows**
2. **Primera ventana**: Doble click en `start-backend.bat`
3. **Segunda ventana**: Doble click en `start-frontend.bat`
4. **Esperar** a que ambos arranquen (30 segundos aprox)
5. **Abrir navegador**: http://localhost:3069

### Opción 2: PowerShell (Recomendado)

**Terminal 1 - Backend:**

```powershell
cd C:\ruta\a\tu\proyecto
.\start-backend.ps1
```

**Terminal 2 - Frontend:**

```powershell
cd C:\ruta\a\tu\proyecto
.\start-frontend.ps1
```

### Opción 3: Manual

**Terminal 1 - Backend:**

```powershell
cd BackEnd
$env:PORT="8099"
go run main.go
```

**Terminal 2 - Frontend:**

```powershell
cd FrontEnd
pnpm dev
```

---

## ✅ Verificar que Todo Funciona

### 1. Backend (debe mostrar):

```
🚀 Iniciando servidor...
📍 Puerto configurado: 8099
✅ MongoDB y configuración inicializados
✅ WebSocket Hub creado
✅ Cliente MQTT inicializado
✅ Servidor HTTP escuchando en puerto 8099
```

### 2. Frontend (debe mostrar):

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:3069/
➜  Network: http://192.168.x.x:3069/
```

### 3. Navegador:

- Ir a: http://localhost:3069
- Debería cargar la pantalla de login
- Si es primera vez, mostrará "Configuración Inicial"

---

## 🔧 Solución de Problemas

### Error: "Failed to load resource: 500 (Internal Server Error)"

**Causa**: Backend no está corriendo o está en puerto incorrecto

**Solución**:

```powershell
# Verificar que backend esté en puerto 8099
netstat -ano | findstr :8099

# Si no aparece nada, iniciar backend:
cd BackEnd
$env:PORT="8099"
go run main.go
```

### Error: "Could not establish connection"

**Causa**: WebSocket no puede conectar al backend

**Solución**:

1. Verificar que backend muestre: "✅ Servidor HTTP escuchando en puerto 8099"
2. Refrescar página del navegador (F5)

### Error: MongoDB connection failed

**Causa**: MongoDB no está corriendo

**Solución**:

```powershell
# Opción A: Iniciar servicio de Windows
Start-Service MongoDB

# Opción B: Iniciar con Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Puertos Ocupados

**Backend (8099) ocupado**:

```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :8099

# Matar proceso (cambiar XXXX por el PID)
taskkill /PID XXXX /F
```

**Frontend (3069) ocupado**:

```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3069

# Matar proceso
taskkill /PID XXXX /F
```

---

## 📋 Configuración de Puertos

Los puertos están configurados así:

| Servicio      | Puerto | Ubicación Configuración              |
| ------------- | ------ | ------------------------------------ |
| **Backend**   | 8099   | BackEnd/.env → PORT=8099             |
| **Frontend**  | 3069   | FrontEnd/vite.config.ts → port: 3069 |
| **MongoDB**   | 27017  | BackEnd/.env → MONGODB_URI           |
| **Proxy API** | 8099   | FrontEnd/vite.config.ts → proxy      |

### Flujo de Conexión:

```
Navegador → http://localhost:3069 (Frontend Vite)
    ↓
Frontend hace request a /api/auth/login
    ↓
Vite Proxy redirige a → http://localhost:8099/api/auth/login (Backend Go)
    ↓
Backend procesa y responde
```

---

## 🎯 Accesos

Una vez todo corriendo:

- **Aplicación Web**: http://localhost:3069
- **API Backend**: http://localhost:8099
- **MongoDB**: mongodb://localhost:27017

---

## 🛑 Detener Todo

Presionar `Ctrl + C` en cada terminal (Backend y Frontend)

---

## 📝 Notas

- Asegúrate de tener **MongoDB corriendo** antes de iniciar el backend
- El **backend debe iniciar primero** antes que el frontend
- Si cambias algo en el código del backend, reinicia el backend
- El frontend tiene **hot-reload** automático (no necesitas reiniciar)
