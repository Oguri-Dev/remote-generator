# PASOS PARA COMPLETAR LA INSTALACION LOCAL

## Estado Actual

✅ Node.js v25.2.1 - INSTALADO
✅ PNPM - INSTALADO
✅ Go 1.25.5 - INSTALADO
✅ Git - INSTALADO
❌ MongoDB - FALTA INSTALAR

---

## MongoDB - Elige una opcion:

### Opcion 1: MongoDB Atlas (Cloud - RECOMENDADO - GRATIS)

1. Ir a: https://www.mongodb.com/cloud/atlas
2. Crear cuenta gratuita
3. Crear un cluster gratis (M0)
4. En "Database Access": Crear un usuario y contraseña
5. En "Network Access": Añadir tu IP (o 0.0.0.0/0 para permitir todas)
6. Click en "Connect" -> "Connect your application"
7. Copiar el connection string
8. Editar BackEnd\.env y pegar el connection string en MONGODB_URI

Ejemplo:
```
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Opcion 2: MongoDB Local (Instalacion en Windows)

1. Descargar desde: https://www.mongodb.com/try/download/community
2. Ejecutar el instalador
3. Seleccionar "Complete" installation
4. Marcar "Install MongoDB as a Service"
5. Dejar las opciones por defecto
6. Finalizar instalacion
7. Verificar que el servicio este corriendo:
   ```powershell
   net start MongoDB
   ```

---

## Proximos Pasos

### 1. Configurar Backend

```powershell
cd BackEnd
Copy-Item .env.example .env
notepad .env
```

Editar con tu configuracion de MongoDB (local o Atlas)

### 2. Configurar Frontend

```powershell
cd ..\FrontEnd
Copy-Item .env.example .env
# Este archivo ya deberia estar OK por defecto
```

### 3. Instalar Dependencias

```powershell
# Backend
cd BackEnd
go mod download
go mod tidy

# Frontend
cd ..\FrontEnd
pnpm install
```

### 4. Ejecutar el Sistema

Opcion A - Scripts PowerShell (2 terminales):
```powershell
# Terminal 1
.\start-backend.ps1

# Terminal 2
.\start-frontend.ps1
```

Opcion B - Archivos .bat:
- Doble click en: start-backend.bat
- Doble click en: start-frontend.bat

### 5. Abrir en Navegador

http://localhost:3069

---

## Instalar como Servicio de Windows (Opcional)

Para que se inicie automaticamente con Windows:

1. Instalar NSSM:
   ```powershell
   choco install nssm
   # O descargar de: https://nssm.cc/download
   ```

2. Ejecutar (como Administrador):
   ```powershell
   .\install-service.ps1
   ```

---

## Comandos Utiles

```powershell
# Ver servicios instalados
Get-Service | Where-Object {$_.Name -like "Generador*"}

# Iniciar servicios
.\start-services.ps1

# Detener servicios
.\stop-services.ps1

# Ver estado
.\start-services.ps1 status

# Desinstalar servicios
.\uninstall-service.ps1
```

---

## Solucion de Problemas

### Error: "MongoDB connection failed"
- Verifica que MongoDB este corriendo (si es local)
- Verifica el connection string en BackEnd\.env
- Si usas Atlas, verifica que tu IP este en la whitelist

### Puerto ocupado
```powershell
# Ver que proceso usa el puerto 8099
netstat -ano | findstr :8099

# Matar el proceso
taskkill /PID <numero_pid> /F
```

### Error al compilar
```powershell
cd BackEnd
go clean
go mod tidy
go build main.go
```
