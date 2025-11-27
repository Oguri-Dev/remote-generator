# 🚀 Guía de Deployment - Sistema Control Generador

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Variables de Entorno](#variables-de-entorno)
- [Desarrollo Local](#desarrollo-local)
- [Deployment con Docker](#deployment-con-docker)
- [Producción](#producción)
- [Troubleshooting](#troubleshooting)

## 🔧 Requisitos

### Desarrollo

- **Go**: 1.24+
- **Node.js**: 18+
- **pnpm**: Latest
- **MongoDB**: 7.0+
- **MQTT Broker**: Mosquitto o similar

### Producción

- **Docker**: 20.10+
- **Docker Compose**: 2.0+

## 🔐 Variables de Entorno

### Backend (BackEnd/.env)

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=generator
MONGODB_COLL=config

# Server
PORT=8099
FRONTEND_ORIGIN=http://localhost:3069

# Environment
ENVIRONMENT=development
```

### Frontend (FrontEnd/.env)

```bash
# API Backend URL
VITE_API_BASE_URL=http://localhost:8099
```

### Docker (.env.docker)

```bash
# MongoDB Credentials
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your_secure_password_here
```

## 💻 Desarrollo Local

### 1. Iniciar MongoDB

```powershell
# Con Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# O instalar localmente
```

### 2. Backend

```powershell
cd BackEnd

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus valores
notepad .env

# Instalar dependencias
go mod download

# Ejecutar
go run main.go
```

### 3. Frontend

```powershell
cd FrontEnd

# Copiar variables de entorno
cp .env.example .env

# Editar .env
notepad .env

# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev
```

Acceder a: http://localhost:3069

## 🐳 Deployment con Docker

### Configuración Inicial

1. **Copiar archivo de entorno**

```powershell
cp .env.docker.example .env.docker
notepad .env.docker  # Cambiar credenciales
```

2. **Build y ejecutar todos los servicios**

```powershell
docker-compose up -d --build
```

Esto levantará:

- MongoDB en puerto 27017
- Backend en puerto 8099
- Frontend (Nginx) en puerto 80

### Comandos Útiles

```powershell
# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar servicios
docker-compose restart backend

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra la BD)
docker-compose down -v

# Reconstruir imagen específica
docker-compose build backend
docker-compose up -d backend
```

### Health Checks

```powershell
# Backend
curl http://localhost:8099/api/auth/check-setup

# Frontend
curl http://localhost:80

# MongoDB (dentro del container)
docker exec generador-mongodb mongosh --eval "db.adminCommand('ping')"
```

## 🌐 Producción

### Opción 1: Docker Compose (Servidor único)

1. **Actualizar .env.docker con credenciales seguras**

```bash
MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
```

2. **Configurar dominio en nginx.conf**

```nginx
server_name tu-dominio.com;
```

3. **Agregar HTTPS con Let's Encrypt**

```powershell
# Instalar Certbot
# Generar certificados
# Actualizar nginx.conf con SSL
```

4. **Deploy**

```powershell
docker-compose -f docker-compose.yml up -d --build
```

### Opción 2: Kubernetes (Escalable)

Ver archivo `k8s/` (próximamente)

### Opción 3: VPS/Cloud Manual

#### Backend

```bash
# Compilar
cd BackEnd
CGO_ENABLED=0 go build -o generador

# Crear servicio systemd
sudo nano /etc/systemd/system/generador-backend.service

# Habilitar y arrancar
sudo systemctl enable generador-backend
sudo systemctl start generador-backend
```

#### Frontend

```bash
cd FrontEnd
pnpm build

# Copiar a Nginx
sudo cp -r dist/* /var/www/html/generador/
```

## 🔍 Troubleshooting

### Backend no conecta a MongoDB

```powershell
# Verificar que MongoDB esté corriendo
docker ps | grep mongodb

# Verificar logs
docker-compose logs mongodb

# Verificar conexión desde container
docker exec generador-backend ping mongodb
```

### Frontend no conecta a Backend

```powershell
# Verificar que backend responda
curl http://localhost:8099/api/auth/check-setup

# Verificar variable de entorno en build
docker-compose build --no-cache frontend
```

### WebSocket no conecta

- Verificar CORS en backend (FRONTEND_ORIGIN)
- Verificar proxy en nginx.conf
- Verificar que el puerto 8099 esté abierto

### MQTT no conecta

- Verificar IP del broker en configuración (MongoDB: collection "config")
- Verificar credenciales MQTT
- Verificar que broker esté accesible desde el container

```powershell
# Probar conexión desde container
docker exec generador-backend ping 192.168.1.101
```

### Heartbeat muestra siempre "Desconectada"

- Verificar que la placa esté enviando mensajes cada 5s
- Verificar topic MQTT en configuración
- Ver logs del backend: `docker-compose logs -f backend`

### Errores de permisos en Docker

```powershell
# Windows: Asegurarse de tener Docker Desktop corriendo
# Linux: Agregar usuario a grupo docker
sudo usermod -aG docker $USER
```

## 📊 Monitoreo

### Logs en Producción

```bash
# Ver logs de todos los servicios
docker-compose logs -f --tail=100

# Solo errores
docker-compose logs -f | grep ERROR
```

### Métricas

```bash
# Estado de containers
docker stats

# Uso de volúmenes
docker system df -v
```

## 🔒 Seguridad en Producción

1. ✅ Cambiar todas las contraseñas por defecto
2. ✅ Usar HTTPS con certificados válidos
3. ✅ Configurar firewall (solo puertos 80, 443)
4. ✅ MongoDB con autenticación habilitada
5. ✅ Backup regular de MongoDB
6. ✅ Actualizar dependencias regularmente

```powershell
# Backup MongoDB
docker exec generador-mongodb mongodump --out /backup

# Restore
docker exec generador-mongodb mongorestore /backup
```

## 📞 Soporte

- Documentación MongoDB: https://docs.mongodb.com
- Documentación Docker: https://docs.docker.com
- Issues del proyecto: https://github.com/Oguri-Dev/remote-generator/issues
