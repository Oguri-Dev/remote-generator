# Sistema de Control Remoto de Generador MQTT

Sistema de partida remota para generador con control de relés mediante MQTT y monitoreo en tiempo real vía WebSocket.

## 🏗️ Arquitectura

- **Backend:** Go 1.21+ con Gorilla Mux, Paho MQTT, MongoDB
- **Frontend:** Vue 3 + TypeScript + Vite + Pinia
- **Protocolo:** MQTT para comunicación con placa Dingtian
- **Tiempo Real:** WebSockets para actualización en vivo del estado

## 📁 Estructura del Proyecto

```
Generador/
├── BackEnd/          # API REST + MQTT Bridge + WebSocket Hub
│   ├── broker/       # Cliente MQTT con reconexión automática
│   ├── config/       # Gestión de configuración MongoDB
│   ├── controllers/  # Lógica de control de secuencias
│   ├── routes/       # Rutas HTTP
│   ├── ws/           # WebSocket Hub
│   └── main.go       # Punto de entrada
│
└── FrontEnd/         # Aplicación Vue 3
    ├── src/
    │   ├── components/pages/generador/  # UI de control
    │   ├── stores/                      # Estado Pinia (MQTT, Placa)
    │   └── services/                    # API cliente
    └── vite.config.ts
```

## 🚀 Instalación

### Backend

```bash
cd BackEnd
go mod download
go run main.go
```

Variables de entorno opcionales:
```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=generator
MONGODB_COLL=config
FRONTEND_ORIGIN=http://localhost:3000
PORT=8099
```

### Frontend

```bash
cd FrontEnd
npm install  # o pnpm install
npm run dev
```

## 🔧 Configuración

La configuración se almacena en MongoDB con el siguiente esquema:

```json
{
  "ipplaca": "192.168.1.100",
  "idplaca": 16,
  "ipbroker": "mqtt.example.com:1883",
  "usermqtt": "usuario",
  "passmqtt": "contraseña",
  "topic": "generador/estado"
}
```

## 📡 Endpoints

### REST API

- `GET /api/config` - Obtener configuración actual
- `PUT /api/config` - Actualizar configuración
- `POST /api/publish` - Publicar mensaje MQTT
- `POST /mqtt/action` - Ejecutar acción en relé
- `GET /mqtt/sequence_state` - Estado de secuencias

### WebSocket

- `GET /ws` - Conexión WebSocket para actualizaciones en tiempo real

## 🎯 Funcionalidades

1. **Control de Generador:**
   - Encendido/apagado de generador principal
   - Monitoreo de estado en tiempo real

2. **Control de Equipamiento:**
   - Rack de Monitoreo
   - Módulo 1 y Módulo 2
   - Reinicio individual o completo

3. **Secuencias Automáticas:**
   - Arranque ordenado con delays configurables
   - Notificación de progreso vía WebSocket

4. **Monitoreo:**
   - Estado de conexión con placa Dingtian
   - Estado de broker MQTT
   - Información de red (IP, MAC, Serial)

## 🛠️ Tecnologías

### Backend
- [Go 1.21+](https://go.dev/)
- [Gorilla Mux](https://github.com/gorilla/mux) - Router HTTP
- [Gorilla WebSocket](https://github.com/gorilla/websocket)
- [Paho MQTT](https://github.com/eclipse/paho.mqtt.golang)
- [MongoDB Driver](https://go.mongodb.org/mongo-driver)

### Frontend
- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [PrimeVue](https://primevue.org/)

## 📝 Próximas Mejoras

- [ ] Graceful shutdown
- [ ] Tests unitarios
- [ ] Logging estructurado
- [ ] Health checks completos
- [ ] Autenticación JWT
- [ ] Encriptación de contraseñas
- [ ] Métricas Prometheus

## 📄 Licencia

Propietario - Todos los derechos reservados

## 👤 Autor

Andres
