# 🔌 Sistema de Control Remoto de Generador

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?logo=go)](https://go.dev/)
[![Vue Version](https://img.shields.io/badge/Vue-3.3+-4FC08D?logo=vue.js)](https://vuejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

Sistema profesional de partida remota para generador eléctrico con control de relés mediante protocolo MQTT, monitoreo en tiempo real vía WebSocket, y panel de administración web.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Reference](#-api-reference)
- [Despliegue Docker](#-despliegue-docker)
- [Seguridad](#-seguridad)
- [Troubleshooting](#-troubleshooting)

## ✨ Características

### Control de Dispositivos

- **Generador Principal** - Encendido/apagado remoto con confirmación de estado
- **Rack de Monitoreo** - Control del sistema de monitoreo central
- **Módulos 1 y 2** - Control individual de módulos auxiliares
- **Reinicio Completo** - Secuencia automatizada de reinicio de todos los equipos

### Monitoreo en Tiempo Real

- 📡 Estado de conexión con placa Dingtian
- 🔄 Actualización instantánea vía WebSocket
- 📊 Indicadores visuales de estado de cada relé
- 🌐 Información de red (IP, MAC, Serial)

### Historial de Activaciones

- 📝 Registro completo de todas las operaciones
- 📅 Filtro por rango de fechas
- 📄 Exportación a PDF con diseño profesional
- 📈 Estadísticas por tipo de acción

### Administración

- ⚙️ Panel de configuración de placa MQTT
- 🔐 Sistema de autenticación de usuarios
- 🌓 Modo claro/oscuro
- 📱 Diseño responsive

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE WEB                              │
│                    (Vue 3 + TypeScript)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Control   │  │ Configuración │  │ Historial Activaciones │  │
│  │  Generador  │  │    Placa      │  │   + Exportación PDF    │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘  │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          │ WebSocket      │ REST API             │ REST API
          │                │                      │
┌─────────┼────────────────┼──────────────────────┼───────────────┐
│         ▼                ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    BACKEND (Go 1.24)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │ WebSocket│ │  REST    │ │  MQTT    │ │  Activity  │  │   │
│  │  │   Hub    │ │Controllers│ │  Bridge  │ │  Logger    │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │   │
│  │       │            │            │             │          │   │
│  │       └────────────┴─────┬──────┴─────────────┘          │   │
│  │                          │                               │   │
│  └──────────────────────────┼───────────────────────────────┘   │
│                             │                                   │
│                      ┌──────▼──────┐                           │
│                      │   MongoDB   │                           │
│                      │  (Config +  │                           │
│                      │   Logs)     │                           │
│                      └─────────────┘                           │
│                       SERVIDOR                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MQTT (TCP/1883)
                              ▼
                    ┌─────────────────┐
                    │  Placa Dingtian │
                    │   (8 Relés)     │
                    │   ┌─┬─┬─┬─┬─┬─┬─┬─┐
                    │   │1│2│3│4│5│6│7│8│
                    │   └─┴─┴─┴─┴─┴─┴─┴─┘
                    └─────────────────┘
```

### Componentes Principales

| Componente        | Tecnología                | Descripción                            |
| ----------------- | ------------------------- | -------------------------------------- |
| **Frontend**      | Vue 3 + TypeScript + Vite | SPA con interfaz moderna y responsive  |
| **Backend**       | Go 1.24 + Gorilla Mux     | API REST + WebSocket Hub + MQTT Bridge |
| **Base de Datos** | MongoDB 7.0               | Almacenamiento de configuración y logs |
| **Comunicación**  | MQTT + WebSocket          | Tiempo real bidireccional              |

## 📁 Estructura del Proyecto

```
Generador/
├── BackEnd/                    # Servidor Go
│   ├── broker/                 # Cliente MQTT con reconexión automática
│   │   └── mqtt.go
│   ├── config/                 # Gestión de configuración MongoDB
│   │   └── service.go
│   ├── controllers/            # Lógica de negocio
│   │   ├── auth.go             # Autenticación de usuarios
│   │   ├── configController.go # Configuración de placa
│   │   ├── mqttController.go   # Publicación MQTT
│   │   ├── activityController.go # Historial de actividades
│   │   └── sequence_controller.go # Control de secuencias
│   ├── databases/              # Conexión MongoDB
│   │   └── conectorMongo.go
│   ├── routes/                 # Definición de rutas HTTP
│   │   └── router.go
│   ├── structs/                # Modelos de datos
│   │   ├── activityStruct.go
│   │   ├── configStruct.go
│   │   └── userStruct.go
│   ├── ws/                     # WebSocket Hub
│   │   └── hub.go
│   ├── main.go                 # Punto de entrada
│   ├── Dockerfile              # Build multi-stage
│   └── .env                    # Variables de entorno
│
├── FrontEnd/                   # Cliente Vue 3
│   ├── src/
│   │   ├── components/
│   │   │   └── pages/generador/
│   │   │       ├── PrincipalViewComponent.vue  # Panel de control
│   │   │       ├── ConfigComponentView.vue     # Configuración
│   │   │       └── ActivityLogsView.vue        # Historial
│   │   ├── stores/             # Estado Pinia
│   │   │   ├── MqttStore.ts    # Estado de conexión
│   │   │   └── PlacaStore.ts   # Estado de placa
│   │   ├── services/           # Comunicación con API
│   │   │   └── mqttService.ts
│   │   ├── layouts/            # Layouts de página
│   │   │   └── AppLayout.vue
│   │   └── pages/              # Rutas de páginas
│   │       └── app/
│   │           ├── index.vue
│   │           ├── config.vue
│   │           └── activity-logs.vue
│   ├── Dockerfile.production   # Build para producción
│   ├── nginx.conf              # Configuración Nginx
│   └── package.json
│
├── docker-export/              # Distribución cliente
│   ├── instalar.ps1            # Script de instalación
│   ├── desinstalar.ps1         # Script de desinstalación
│   └── docker-compose.yml
│
├── docker-compose.yml          # Desarrollo local
├── docker-compose-cliente.yml  # Producción cliente
├── exportar-docker.ps1         # Script de exportación
└── README.md                   # Esta documentación
```

## 💻 Requisitos

### Desarrollo

- **Go** 1.24 o superior
- **Node.js** 18+ con pnpm
- **MongoDB** 7.0+
- **Broker MQTT** (Mosquitto o similar)

### Producción (Docker)

- **Docker** 20.10+
- **Docker Compose** v2+
- **RAM** mínimo 2GB
- **Espacio** ~500MB

## 🚀 Instalación

### Desarrollo Local

#### 1. Clonar repositorio

```bash
git clone https://github.com/Oguri-Dev/remote-generator.git
cd remote-generator
```

#### 2. Backend

```bash
cd BackEnd

# Crear archivo .env
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=generator
MONGODB_COLL=config
FRONTEND_ORIGIN=http://localhost:3069
PORT=8099
EOF

# Instalar dependencias y ejecutar
go mod download
go run .
```

#### 3. Frontend

```bash
cd FrontEnd

# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev
```

#### 4. Acceder

- **Frontend:** http://localhost:3069
- **Backend:** http://localhost:8099
- **WebSocket:** ws://localhost:8099/ws

### Producción con Docker

Ver sección [Despliegue Docker](#-despliegue-docker).

## ⚙️ Configuración

### Variables de Entorno - Backend

| Variable          | Descripción                | Default                     |
| ----------------- | -------------------------- | --------------------------- |
| `MONGODB_URI`     | URI de conexión MongoDB    | `mongodb://localhost:27017` |
| `MONGODB_DB`      | Nombre de la base de datos | `generator`                 |
| `MONGODB_COLL`    | Colección de configuración | `config`                    |
| `FRONTEND_ORIGIN` | URL del frontend (CORS)    | `http://localhost:3069`     |
| `PORT`            | Puerto del servidor        | `8099`                      |

### Variables de Entorno - Frontend

| Variable            | Descripción          | Default                 |
| ------------------- | -------------------- | ----------------------- |
| `VITE_API_BASE_URL` | URL base del backend | `http://localhost:8099` |

### Configuración de Placa (MongoDB)

```json
{
  "ipplaca": "192.168.1.100",
  "idplaca": "8721",
  "ipbroker": "192.168.1.101:1883",
  "usermqtt": "",
  "passmqtt": "",
  "topic": "/dingtian/relay8721"
}
```

## 📖 Uso

### Panel de Control Principal

1. **Encender Generador:** Click en "Encender Generador" para activar el relé 1
2. **Apagar Generador:** Click en "Apagar Generador"
3. **Reiniciar Todo:** Ejecuta secuencia completa de reinicio de todos los módulos
4. **Reinicio Individual:** Cada módulo tiene su propio botón de reinicio

### Configuración de Placa

1. Acceder a **Configuración** en el menú lateral
2. Modificar los parámetros:
   - IP de la placa Dingtian
   - ID de la placa
   - Dirección del broker MQTT
   - Credenciales MQTT (opcional)
3. Guardar cambios

### Historial de Activaciones

1. Acceder a **Historial** en el menú lateral
2. Ver todas las acciones realizadas con fecha/hora
3. Filtrar por rango de fechas usando los selectores
4. Exportar a PDF haciendo click en "Exportar PDF"
5. Limpiar historial con "Limpiar Historial"

## 📡 API Reference

### REST Endpoints

#### Configuración

```http
GET /api/config
```

Obtiene la configuración actual de la placa.

```http
PUT /api/config
Content-Type: application/json

{
  "ipplaca": "192.168.1.100",
  "idplaca": "8721",
  "ipbroker": "192.168.1.101:1883"
}
```

Actualiza la configuración de la placa.

#### Control MQTT

```http
POST /api/mqtt/action
Content-Type: application/json

{
  "action": "start" | "stop" | "restart",
  "relayId": "1" | "2" | "3" | "4"
}
```

Ejecuta una acción sobre un relé específico.

```http
GET /api/mqtt/sequence_state
```

Obtiene el estado actual de las secuencias en ejecución.

#### Historial de Actividades

```http
GET /api/activity/logs
```

Retorna los últimos 1000 registros de actividad.

```http
DELETE /api/activity/logs
```

Elimina todo el historial de actividades.

```http
GET /api/activity/stats
```

Retorna estadísticas agregadas por tipo de acción.

#### Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

```http
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/me
GET /api/auth/check-setup
```

### WebSocket

```javascript
// Conectar al WebSocket
const ws = new WebSocket('ws://localhost:8099/ws')

// Recibir actualizaciones de estado
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // data contiene el estado actualizado de los relés
}
```

Mensajes recibidos:

- Estado de conexión de placa
- Estado de relés (ON/OFF)
- Información de red (IP, MAC, Serial)
- Notificaciones de secuencias

## 🐳 Despliegue Docker

### Generar Imágenes para Cliente

```powershell
# En Windows PowerShell
.\exportar-docker.ps1
```

Esto genera:

- `docker-export/generador-backend.tar` (~12 MB)
- `docker-export/generador-frontend.tar` (~42 MB)
- `docker-export/mongo.tar` (~267 MB)
- `GeneradorControl-Instalador.zip` (~319 MB)

### Instalación en Cliente

1. Copiar `GeneradorControl-Instalador.zip` al servidor destino
2. Descomprimir el archivo
3. Ejecutar como administrador:

```powershell
.\instalar.ps1
```

4. Acceder a `http://localhost`

### Desinstalación

```powershell
.\desinstalar.ps1
```

### Docker Compose Manual

```yaml
# docker-compose.yml
services:
  backend:
    image: generador-backend:latest
    ports:
      - '8099:8099'
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - FRONTEND_ORIGIN=http://localhost
    depends_on:
      - mongo

  frontend:
    image: generador-frontend:latest
    ports:
      - '80:80'
    depends_on:
      - backend

  mongo:
    image: mongo:7.0
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🔐 Seguridad

### Implementado

- ✅ Autenticación de usuarios con sesiones
- ✅ Contraseñas hasheadas con bcrypt
- ✅ CORS configurado
- ✅ Imágenes Docker sin código fuente
- ✅ Usuario no-root en contenedores

### Recomendaciones para Producción

- Usar HTTPS con certificado SSL
- Configurar firewall para puertos necesarios
- Cambiar contraseñas por defecto
- Montar volumen externo para MongoDB
- Configurar backups automáticos

## 🔧 Troubleshooting

### El frontend no conecta con el backend

1. Verificar que el backend esté corriendo en el puerto correcto
2. Revisar `FRONTEND_ORIGIN` en variables de entorno del backend
3. Comprobar que no haya conflictos de CORS

### WebSocket se desconecta frecuentemente

1. Verificar conectividad de red
2. Revisar logs del backend para errores
3. El sistema tiene reconexión automática implementada

### La placa Dingtian no responde

1. Verificar IP y puerto del broker MQTT
2. Comprobar que el ID de placa sea correcto
3. Revisar credenciales MQTT si están configuradas
4. Verificar conectividad de red con el broker

### Error al exportar PDF

1. Verificar que haya registros en el historial
2. Los filtros de fecha deben estar en formato correcto
3. Revisar consola del navegador para errores

### Docker no inicia los contenedores

1. Verificar que Docker Desktop esté corriendo
2. Comprobar puertos disponibles (80, 8099, 27017)
3. Revisar logs: `docker-compose logs -f`

## 📝 Changelog

### v2.0.0 (Diciembre 2024)

- ✨ Historial de activaciones con filtros
- ✨ Exportación a PDF
- 🔧 Fix WebSocket concurrent write panic
- 🔧 Fix CORS en producción Docker
- 🐳 Sistema de exportación de imágenes Docker
- 📚 Documentación completa

### v1.0.0 (Inicial)

- Panel de control de relés
- Conexión MQTT con placa Dingtian
- WebSocket para tiempo real
- Autenticación básica

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agrega nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Propietario - Todos los derechos reservados

## 👤 Autor

**Oguri-Dev**

---

<p align="center">
  <sub>Desarrollado con ❤️ para control industrial</sub>
</p>
