# 🐳 Instalación con Docker

Este proyecto incluye scripts para instalar y ejecutar completamente el sistema de Control de Generador usando Docker, incluyendo MongoDB, MQTT Broker, Backend (Go) y Frontend (Vue).

## 📋 Requisitos Previos

- **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop)
- **Git** (opcional, si clonás desde GitHub) - [Descargar aquí](https://git-scm.com/download/win)
- **Windows 10+** o **Windows Server 2016+**

## 🚀 Opción 1: Instalación Rápida (Recomendado)

### Windows (Interfaz Gráfica)

1. **Abre una ventana del Explorador** y navega a la carpeta del proyecto
2. **Doble-click** en `install-docker.bat`
3. Sigue las instrucciones que aparecen en pantalla
4. El script instalará y iniciará automáticamente todos los contenedores

### Windows (PowerShell)

```powershell
cd "C:\ruta\a\tu\proyecto"
.\install-docker.ps1
```

## 🚀 Opción 2: Instalación Desde GitHub

Si quieres descargar el proyecto desde GitHub e instalarlo automáticamente:

```powershell
# 1. Edita el archivo install-from-github.ps1
# Cambia esta línea:
#   $GITHUB_REPO = "https://github.com/tu-usuario/generador.git"
# Por tu URL real de repositorio

# 2. Ejecuta el script
.\install-from-github.ps1
```

## 📦 Servicios que se Instalan

El script de instalación crea y ejecuta automáticamente los siguientes contenedores:

### 🗄️ MongoDB 7.0

- **Puerto**: 27017
- **Usuario**: (configurado durante la instalación)
- **Contraseña**: (configurada durante la instalación)
- **Volumen persistente**: `mongodb_data`

### 🦟 MQTT Broker (Mosquitto)

- **Puerto MQTT**: 1883
- **Puerto WebSocket**: 9001
- **Volumen persistente**: `mqtt_data`
- **Logs**: `mqtt_logs`

### ⚙️ Backend (Go)

- **Puerto**: 8099
- **Imagen**: `generador-backend:latest`
- **Base de datos**: MongoDB
- **Broker**: Mosquitto MQTT

### 🌐 Frontend (Vue 3 + Nginx)

- **Puerto**: 80
- **Imagen**: `generador-frontend:latest`
- **API Base**: http://localhost:8099

## 🎯 Después de la Instalación

Una vez ejecutado el script, el sistema debería estar disponible en:

```
Frontend:        http://localhost
Backend API:     http://localhost:8099
MQTT Broker:     localhost:1883 (WebSocket: 9001)
MongoDB:         localhost:27017
```

### Verificar que Todo Funciona

```powershell
# Ver estado de todos los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f mqtt-broker
```

## 🛠️ Comandos Útiles

### Gestionar Contenedores

```powershell
# Iniciar los contenedores
docker-compose up -d

# Detener los contenedores
docker-compose down

# Reiniciar los contenedores
docker-compose restart

# Rebuild de las imágenes
docker-compose up -d --build

# Ver logs con follow
docker-compose logs -f
```

### Acceder a MongoDB

```powershell
# Conectarse a MongoDB desde la CLI
docker exec -it generador-mongodb mongosh mongodb://admin:changeme@localhost:27017

# O desde MongoDB Compass
# Connection string: mongodb://admin:changeme@localhost:27017
```

### Acceder a MQTT

```powershell
# Suscribirse a un topic
docker exec -it generador-mqtt-broker mosquitto_sub -h localhost -t "testing/hello"

# Publicar un mensaje
docker exec -it generador-mqtt-broker mosquitto_pub -h localhost -t "testing/hello" -m "Hello MQTT"
```

## 📝 Variables de Entorno

El script crea automáticamente un archivo `.env.docker` con las siguientes variables:

```bash
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=changeme

# Backend
BACKEND_PORT=8099
FRONTEND_ORIGIN=http://localhost

# MQTT Broker
MQTT_PORT=1883
MQTT_WS_PORT=9001

# Frontend
FRONTEND_PORT=80

# Environment
ENVIRONMENT=production
```

Puedes editar este archivo después de la instalación para cambiar puertos o credenciales, pero deberás hacer `docker-compose down && docker-compose up -d` para que los cambios tomen efecto.

## 🔒 Seguridad en Producción

Si vas a desplegar esto en producción, considera:

1. **Cambiar credenciales de MongoDB** en `.env.docker`
2. **Habilitar autenticación en Mosquitto** (descomentar en `mosquitto.conf`)
3. **Usar HTTPS** para el frontend
4. **Usar variables de entorno seguras**
5. **Configurar firewall** adecuadamente
6. **Usar redes privadas** en lugar de exponer puertos directamente

## ❌ Solución de Problemas

### Docker no inicia

```powershell
# Asegúrate de que Docker Desktop esté ejecutándose
docker info
```

### Contenedor no arranca

```powershell
# Ver logs detallados
docker-compose logs [nombre-del-servicio]

# Ejemplo:
docker-compose logs backend
```

### Puerto en uso

```powershell
# Ver qué proceso está usando un puerto
netstat -ano | findstr :8099

# Cambiar puerto en .env.docker y reiniciar
docker-compose down
docker-compose up -d
```

### MongoDB no conecta

```powershell
# Verificar que MongoDB esté corriendo
docker ps | findstr mongodb

# Ver logs
docker logs generador-mongodb
```

## 📚 Más Información

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)

## 🤝 Soporte

Si encuentras problemas, revisa:

1. Los logs de Docker: `docker-compose logs`
2. Que Docker Desktop esté corriendo
3. Que tengas permisos de administrador en Windows
4. Que los puertos no estén en uso por otros servicios
