const PDFDocument = require('pdfkit')
const fs = require('fs')

// Crear documento PDF
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Sistema de Control Remoto de Generador - Documentación Técnica',
    Author: 'Oguri-Dev',
    Subject: 'Documentación del Sistema de Control de Generador MQTT',
  },
})

// Pipe a archivo
const outputPath = './DocumentacionTecnica-GeneradorControl.pdf'
doc.pipe(fs.createWriteStream(outputPath))

// Colores
const colors = {
  primary: '#2980b9',
  secondary: '#27ae60',
  dark: '#2c3e50',
  light: '#ecf0f1',
  warning: '#f39c12',
  danger: '#e74c3c',
}

// Función para títulos de sección
function sectionTitle(text, level = 1) {
  doc.moveDown(level === 1 ? 1.5 : 1)
  doc
    .fontSize(level === 1 ? 20 : 16)
    .fillColor(colors.primary)
    .text(text, { underline: level === 1 })
  doc.moveDown(0.5)
  doc.fillColor(colors.dark)
}

// Función para subtítulos
function subTitle(text) {
  doc.moveDown(0.5)
  doc.fontSize(14).fillColor(colors.secondary).text(text)
  doc.moveDown(0.3)
  doc.fillColor(colors.dark)
}

// Función para texto normal
function normalText(text, options = {}) {
  doc.fontSize(11).fillColor(colors.dark).text(text, options)
}

// Función para código
function codeBlock(code) {
  doc.moveDown(0.3)
  doc.fontSize(9).fillColor('#333').font('Courier').text(code, { indent: 20 })
  doc.font('Helvetica')
  doc.moveDown(0.3)
}

// Función para lista
function bulletList(items) {
  items.forEach((item) => {
    doc.fontSize(11).fillColor(colors.dark).text(`• ${item}`, { indent: 15 })
  })
}

// Función para tabla simple
function simpleTable(headers, rows) {
  const colWidth = (doc.page.width - 100) / headers.length
  const startX = 50
  let startY = doc.y

  // Headers
  doc.fontSize(10).font('Helvetica-Bold')
  headers.forEach((header, i) => {
    doc
      .fillColor(colors.primary)
      .text(header, startX + i * colWidth, startY, { width: colWidth - 5 })
  })

  doc.moveDown(0.5)
  startY = doc.y

  // Rows
  doc.font('Helvetica').fillColor(colors.dark)
  rows.forEach((row, rowIndex) => {
    const rowY = startY + rowIndex * 20
    row.forEach((cell, i) => {
      doc.fontSize(9).text(cell, startX + i * colWidth, rowY, { width: colWidth - 5 })
    })
  })

  doc.y = startY + rows.length * 20 + 10
}

// ==================== CONTENIDO DEL DOCUMENTO ====================

// PORTADA
doc.fontSize(32).fillColor(colors.primary).text('Sistema de Control', { align: 'center' })
doc.fontSize(32).text('Remoto de Generador', { align: 'center' })
doc.moveDown(0.5)
doc
  .fontSize(18)
  .fillColor(colors.secondary)
  .text('Documentación Técnica Completa', { align: 'center' })

doc.moveDown(3)
doc.fontSize(14).fillColor(colors.dark).text('Versión 2.0.0', { align: 'center' })
doc.text('Diciembre 2024', { align: 'center' })

doc.moveDown(4)

// Logo/Diagrama simple
doc.rect(200, doc.y, 200, 100).stroke(colors.primary)
doc
  .fontSize(12)
  .fillColor(colors.primary)
  .text('🔌 MQTT Control System', 210, doc.y + 10, { width: 180, align: 'center' })
doc.text('Vue 3 + Go + MongoDB', 210, doc.y + 30, { width: 180, align: 'center' })

doc.moveDown(8)
doc.fontSize(12).fillColor(colors.dark).text('Desarrollado por: Oguri-Dev', { align: 'center' })
doc.text('GitHub: github.com/Oguri-Dev/remote-generator', { align: 'center' })

// Nueva página - Índice
doc.addPage()
sectionTitle('📋 Índice de Contenidos')
doc.fontSize(12)

const toc = [
  '1. Introducción y Descripción General',
  '2. Arquitectura del Sistema',
  '3. Estructura del Proyecto',
  '4. Componentes del Backend (Go)',
  '5. Componentes del Frontend (Vue 3)',
  '6. Base de Datos (MongoDB)',
  '7. Comunicación MQTT',
  '8. WebSocket en Tiempo Real',
  '9. API REST - Endpoints',
  '10. Instalación y Configuración',
  '11. Despliegue con Docker',
  '12. Guía de Instalación en Cliente',
  '13. Troubleshooting',
  '14. Seguridad',
  '15. Mantenimiento y Actualizaciones',
]

toc.forEach((item, i) => {
  doc.text(item, { indent: 20 })
  doc.moveDown(0.3)
})

// SECCIÓN 1: INTRODUCCIÓN
doc.addPage()
sectionTitle('1. Introducción y Descripción General')

normalText(
  'El Sistema de Control Remoto de Generador es una solución profesional para la gestión y monitoreo de generadores eléctricos mediante protocolo MQTT. Permite el control remoto de hasta 8 relés a través de una placa Dingtian, con actualización en tiempo real del estado de los dispositivos.'
)

doc.moveDown()
subTitle('1.1 Características Principales')
bulletList([
  'Control remoto de generador principal (encendido/apagado)',
  'Control de Rack de Monitoreo con reinicio automático',
  'Control de Módulos auxiliares (Módulo 1 y Módulo 2)',
  'Secuencia automatizada de reinicio completo',
  'Monitoreo en tiempo real vía WebSocket',
  'Historial completo de activaciones',
  'Exportación de reportes a PDF',
  'Filtrado por rango de fechas',
  'Panel de configuración de placa MQTT',
  'Autenticación de usuarios',
  'Diseño responsive y modo oscuro',
])

doc.moveDown()
subTitle('1.2 Tecnologías Utilizadas')

doc.moveDown(0.3)
normalText('Backend:', { continued: false })
bulletList([
  'Go 1.24+ (Lenguaje de programación)',
  'Gorilla Mux (Router HTTP)',
  'Gorilla WebSocket (Comunicación tiempo real)',
  'Paho MQTT (Cliente MQTT)',
  'MongoDB Driver (Base de datos)',
])

doc.moveDown(0.3)
normalText('Frontend:', { continued: false })
bulletList([
  'Vue 3.3+ (Framework JavaScript)',
  'TypeScript (Tipado estático)',
  'Vite 5 (Build tool)',
  'Pinia (State management)',
  'PrimeVue (Componentes UI)',
  'jsPDF (Generación de PDFs)',
])

// SECCIÓN 2: ARQUITECTURA
doc.addPage()
sectionTitle('2. Arquitectura del Sistema')

normalText('El sistema sigue una arquitectura de microservicios con comunicación en tiempo real:')

doc.moveDown()
subTitle('2.1 Diagrama de Arquitectura')

// Diagrama ASCII
codeBlock(`
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
│  │       └────────────┴─────┬──────┴─────────────┘          │   │
│  └──────────────────────────┼───────────────────────────────┘   │
│                             │                                   │
│                      ┌──────▼──────┐                           │
│                      │   MongoDB   │                           │
│                      │  (Config +  │                           │
│                      │   Logs)     │                           │
│                      └─────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MQTT (TCP/1883)
                              ▼
                    ┌─────────────────┐
                    │  Placa Dingtian │
                    │   (8 Relés)     │
                    └─────────────────┘
`)

doc.moveDown()
subTitle('2.2 Flujo de Datos')

normalText('1. Usuario interactúa con la interfaz web (Vue 3)')
normalText('2. Frontend envía petición REST al Backend (Go)')
normalText('3. Backend publica mensaje MQTT a la placa Dingtian')
normalText('4. Placa ejecuta la acción en el relé correspondiente')
normalText('5. Placa responde con nuevo estado vía MQTT')
normalText('6. Backend recibe estado y lo retransmite vía WebSocket')
normalText('7. Frontend actualiza la UI en tiempo real')
normalText('8. Backend registra la actividad en MongoDB')

// SECCIÓN 3: ESTRUCTURA
doc.addPage()
sectionTitle('3. Estructura del Proyecto')

codeBlock(`
Generador/
├── BackEnd/                    # Servidor Go
│   ├── broker/                 # Cliente MQTT
│   │   └── mqtt.go             # Conexión y publicación MQTT
│   ├── config/                 # Configuración
│   │   └── service.go          # Gestión de config en MongoDB
│   ├── controllers/            # Controladores
│   │   ├── auth.go             # Autenticación usuarios
│   │   ├── configController.go # Config de placa
│   │   ├── mqttController.go   # Publicación MQTT
│   │   ├── activityController.go # Historial
│   │   └── sequence_controller.go # Secuencias
│   ├── databases/              # Conexión DB
│   │   └── conectorMongo.go
│   ├── routes/                 # Rutas HTTP
│   │   └── router.go
│   ├── structs/                # Modelos de datos
│   │   ├── activityStruct.go
│   │   ├── configStruct.go
│   │   └── userStruct.go
│   ├── ws/                     # WebSocket
│   │   └── hub.go              # Hub centralizado
│   ├── main.go                 # Punto de entrada
│   ├── Dockerfile              # Build multi-stage
│   └── .env                    # Variables de entorno
│
├── FrontEnd/                   # Cliente Vue 3
│   ├── src/
│   │   ├── components/pages/generador/
│   │   │   ├── PrincipalViewComponent.vue
│   │   │   ├── ConfigComponentView.vue
│   │   │   └── ActivityLogsView.vue
│   │   ├── stores/
│   │   │   ├── MqttStore.ts
│   │   │   └── PlacaStore.ts
│   │   ├── services/
│   │   │   └── mqttService.ts
│   │   └── layouts/
│   │       └── AppLayout.vue
│   ├── Dockerfile.production
│   ├── nginx.conf
│   └── package.json
│
├── docker-export/              # Distribución
│   ├── instalar.ps1
│   ├── desinstalar.ps1
│   └── docker-compose.yml
│
├── docker-compose.yml          # Desarrollo
├── exportar-docker.ps1         # Script exportación
└── README.md                   # Documentación
`)

// SECCIÓN 4: BACKEND
doc.addPage()
sectionTitle('4. Componentes del Backend (Go)')

subTitle('4.1 main.go - Punto de Entrada')
normalText('Inicializa todos los servicios del backend:')
bulletList([
  'Carga de variables de entorno (.env)',
  'Conexión a MongoDB',
  'Inicialización del Hub WebSocket',
  'Conexión al broker MQTT',
  'Configuración del router HTTP',
  'Graceful shutdown',
])

doc.moveDown()
subTitle('4.2 ws/hub.go - WebSocket Hub')
normalText(
  'Gestiona todas las conexiones WebSocket con arquitectura channel-based para evitar escrituras concurrentes:'
)

codeBlock(`
type Hub struct {
    clients   map[*client]bool  // Clientes conectados
    broadcast chan []byte       // Canal de broadcast
    register  chan *client      // Registro de nuevos clientes
    unregister chan *client     // Desregistro de clientes
}

// Cada cliente tiene su propio canal de escritura
type client struct {
    conn    *websocket.Conn
    sendCh  chan []byte  // Buffer de 256 mensajes
}
`)

doc.moveDown()
subTitle('4.3 broker/mqtt.go - Cliente MQTT')
normalText('Maneja la comunicación con la placa Dingtian:')
bulletList([
  'Conexión con reconexión automática',
  'Suscripción a topics de estado',
  'Publicación de comandos de control',
  'Parsing de mensajes JSON',
])

doc.moveDown()
subTitle('4.4 controllers/activityController.go - Historial')
normalText('Gestiona el registro de actividades:')

codeBlock(`
// LogActivity - Registra una activación
func (a *ConfigAPI) LogActivity(relayID, relayName, 
                                 action, description, user string)

// GetActivityLogs - Obtiene los últimos 1000 registros
func (a *ConfigAPI) GetActivityLogs(w http.ResponseWriter, 
                                     r *http.Request)

// ClearActivityLogs - Elimina todo el historial
func (a *ConfigAPI) ClearActivityLogs(w http.ResponseWriter, 
                                       r *http.Request)

// GetActivityStats - Estadísticas por tipo de acción
func (a *ConfigAPI) GetActivityStats(w http.ResponseWriter, 
                                      r *http.Request)
`)

// SECCIÓN 5: FRONTEND
doc.addPage()
sectionTitle('5. Componentes del Frontend (Vue 3)')

subTitle('5.1 PrincipalViewComponent.vue')
normalText('Panel principal de control con:')
bulletList([
  'Estado del generador (ON/OFF)',
  'Estado del Rack de Monitoreo',
  'Estado de Módulos 1 y 2',
  'Botones de control (encender, apagar, reiniciar)',
  'Indicadores de conexión (placa, broker)',
  'Progreso de secuencias activas',
])

doc.moveDown()
subTitle('5.2 ConfigComponentView.vue')
normalText('Configuración de la placa MQTT:')
bulletList([
  'IP de la placa Dingtian',
  'ID de la placa',
  'Dirección del broker MQTT',
  'Credenciales MQTT (usuario/contraseña)',
  'Guardado en MongoDB',
])

doc.moveDown()
subTitle('5.3 ActivityLogsView.vue')
normalText('Historial de activaciones con:')
bulletList([
  'Tabla de registros con fecha/hora',
  'Filtros por rango de fechas',
  'Estadísticas por tipo de acción',
  'Exportación a PDF profesional',
  'Botón de limpieza de historial',
])

doc.moveDown()
subTitle('5.4 Stores (Pinia)')

normalText('MqttStore.ts - Estado de conexión WebSocket:')
codeBlock(`
export const useMqttStore = defineStore('mqtt', {
  state: () => ({
    isConnected: false,
    sequenceState: {} as Record<string, string>,
    ws: null as WebSocket | null
  }),
  actions: {
    connectToWebSocket()
    disconnect()
  }
})
`)

normalText('PlacaStore.ts - Estado de la placa:')
codeBlock(`
export const usePlacaStore = defineStore('placa', {
  state: () => ({
    connectionStatus: 'Desconectada',
    ip: '',
    mac: '',
    serialNumber: '',
    relays: {} as Record<string, string>
  })
})
`)

// SECCIÓN 6: BASE DE DATOS
doc.addPage()
sectionTitle('6. Base de Datos (MongoDB)')

subTitle('6.1 Colecciones')

normalText('config - Configuración de la placa:')
codeBlock(`
{
  "_id": ObjectId,
  "ipplaca": "192.168.1.100",
  "idplaca": "8721",
  "ipbroker": "192.168.1.101:1883",
  "usermqtt": "",
  "passmqtt": "",
  "topic": "/dingtian/relay8721"
}
`)

doc.moveDown()
normalText('users - Usuarios del sistema:')
codeBlock(`
{
  "_id": ObjectId,
  "username": "admin",
  "password": "$2a$10$...",  // bcrypt hash
  "createdAt": ISODate
}
`)

doc.moveDown()
normalText('activity_logs - Historial de activaciones:')
codeBlock(`
{
  "_id": ObjectId,
  "timestamp": ISODate("2024-12-01T15:30:00Z"),
  "relayId": "1",
  "relayName": "Generador",
  "action": "ON",
  "description": "Generador - ON",
  "user": "system"
}
`)

// SECCIÓN 7: MQTT
doc.addPage()
sectionTitle('7. Comunicación MQTT')

subTitle('7.1 Estructura de Topics')

normalText('Topic de publicación (comandos):')
codeBlock('/dingtian/relay{ID}/in/control')

normalText('Topic de suscripción (estados):')
codeBlock('/dingtian/relay{ID}/out/#')

doc.moveDown()
subTitle('7.2 Formato de Mensajes')

normalText('Comando ON/OFF:')
codeBlock(`
{
  "type": "ON/OFF",
  "idx": "1",        // Número de relé (1-8)
  "status": "ON",    // ON o OFF
  "time": "0",       // Tiempo (0 = permanente)
  "pass": "0"        // Password
}
`)

normalText('Comando DELAY (reinicio):')
codeBlock(`
{
  "type": "DELAY",
  "idx": "2",
  "status": "OFF",
  "time": "5",       // Tiempo en segundos
  "pass": "0"
}
`)

doc.moveDown()
subTitle('7.3 Mapeo de Relés')

doc.moveDown(0.5)
const relayTable = [
  ['1', 'Generador', 'Encendido/apagado principal'],
  ['2', 'Rack Monitoreo', 'Sistema de monitoreo'],
  ['3', 'Módulo 1', 'Equipamiento auxiliar 1'],
  ['4', 'Módulo 2', 'Equipamiento auxiliar 2'],
  ['5-7', 'Reservados', 'Sin asignar'],
  ['8', 'Modo Manual', 'Indicador de modo manual'],
]

simpleTable(['Relé', 'Dispositivo', 'Descripción'], relayTable)

// SECCIÓN 8: WEBSOCKET
doc.addPage()
sectionTitle('8. WebSocket en Tiempo Real')

subTitle('8.1 Conexión')
codeBlock(`
// URL de conexión
ws://localhost:8099/ws

// En producción
ws://servidor:8099/ws
`)

subTitle('8.2 Mensajes Recibidos')

normalText('Estado de conexión de placa:')
codeBlock(`
{
  "type": "connection",
  "status": "Conectada",
  "ip": "192.168.1.100",
  "mac": "AA:BB:CC:DD:EE:FF",
  "serial": "DT8721"
}
`)

normalText('Estado de relés:')
codeBlock(`
{
  "type": "relay_status",
  "relays": {
    "1": "ON",
    "2": "OFF",
    "3": "ON",
    "4": "OFF"
  }
}
`)

normalText('Notificación de secuencia:')
codeBlock(`
{
  "type": "sequence",
  "relayId": "1",
  "state": "starting",  // starting, stopping, restarting, ""
  "message": "Iniciando generador..."
}
`)

// SECCIÓN 9: API REST
doc.addPage()
sectionTitle('9. API REST - Endpoints')

subTitle('9.1 Configuración')

normalText('GET /api/config - Obtener configuración')
codeBlock(`
Response 200:
{
  "ipplaca": "192.168.1.100",
  "idplaca": "8721",
  "ipbroker": "192.168.1.101:1883"
}
`)

normalText('PUT /api/config - Actualizar configuración')
codeBlock(`
Request Body:
{
  "ipplaca": "192.168.1.100",
  "idplaca": "8721",
  "ipbroker": "192.168.1.101:1883"
}

Response 200: { "message": "OK" }
`)

doc.moveDown()
subTitle('9.2 Control MQTT')

normalText('POST /api/mqtt/action - Ejecutar acción')
codeBlock(`
Request Body:
{
  "relayId": "1",
  "action": "ON"  // ON, OFF, restart
}

Response 200: { "message": "Action sent" }
`)

normalText('GET /api/mqtt/sequence_state - Estado de secuencias')
codeBlock(`
Response 200:
{
  "1": "",
  "2": "restarting",
  "3": "",
  "4": ""
}
`)

doc.moveDown()
subTitle('9.3 Historial de Actividades')

normalText('GET /api/activity/logs')
normalText('DELETE /api/activity/logs')
normalText('GET /api/activity/stats')

doc.moveDown()
subTitle('9.4 Autenticación')

normalText('POST /api/auth/login')
normalText('POST /api/auth/register')
normalText('POST /api/auth/logout')
normalText('GET /api/auth/me')
normalText('GET /api/auth/check-setup')

// SECCIÓN 10: INSTALACIÓN
doc.addPage()
sectionTitle('10. Instalación y Configuración')

subTitle('10.1 Requisitos del Sistema')

normalText('Desarrollo:')
bulletList([
  'Go 1.24 o superior',
  'Node.js 18+ con pnpm',
  'MongoDB 7.0+',
  'Broker MQTT (Mosquitto recomendado)',
])

normalText('Producción (Docker):')
bulletList(['Docker 20.10+', 'Docker Compose v2+', 'RAM mínimo 2GB', 'Espacio en disco ~500MB'])

doc.moveDown()
subTitle('10.2 Instalación para Desarrollo')

normalText('1. Clonar repositorio:')
codeBlock('git clone https://github.com/Oguri-Dev/remote-generator.git\ncd remote-generator')

normalText('2. Configurar Backend:')
codeBlock(`cd BackEnd

# Crear archivo .env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=generator
MONGODB_COLL=config
FRONTEND_ORIGIN=http://localhost:3069
PORT=8099

# Ejecutar
go mod download
go run .`)

normalText('3. Configurar Frontend:')
codeBlock(`cd FrontEnd

# Instalar dependencias
pnpm install

# Ejecutar
pnpm dev`)

normalText('4. Acceder a la aplicación:')
bulletList(['Frontend: http://localhost:3069', 'Backend: http://localhost:8099'])

// SECCIÓN 11: DOCKER
doc.addPage()
sectionTitle('11. Despliegue con Docker')

subTitle('11.1 Generar Imágenes para Distribución')

normalText('Ejecutar el script de exportación:')
codeBlock('.\\exportar-docker.ps1')

normalText('Este script genera:')
bulletList([
  'docker-export/generador-backend.tar (~12 MB)',
  'docker-export/generador-frontend.tar (~42 MB)',
  'docker-export/mongo.tar (~267 MB)',
  'GeneradorControl-Instalador.zip (~319 MB)',
])

doc.moveDown()
subTitle('11.2 Contenido del Archivo ZIP')

codeBlock(`GeneradorControl-Instalador/
├── generador-backend.tar    # Imagen del backend
├── generador-frontend.tar   # Imagen del frontend
├── mongo.tar                # Imagen de MongoDB
├── docker-compose.yml       # Configuración Docker
├── .env.docker.example      # Variables de entorno
├── instalar.ps1             # Script de instalación
├── desinstalar.ps1          # Script de desinstalación
└── INSTRUCCIONES.txt        # Guía rápida`)

doc.moveDown()
subTitle('11.3 docker-compose.yml (Cliente)')

codeBlock(`services:
  backend:
    image: generador-backend:latest
    ports:
      - "8099:8099"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - MONGODB_DB=generator
      - FRONTEND_ORIGIN=http://localhost
      - PORT=8099
    depends_on:
      - mongo
    restart: unless-stopped

  frontend:
    image: generador-frontend:latest
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  mongo:
    image: mongo:7.0
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:`)

// SECCIÓN 12: GUÍA CLIENTE
doc.addPage()
sectionTitle('12. Guía de Instalación en Cliente')

subTitle('12.1 Requisitos Previos')
bulletList([
  'Windows 10/11 o Windows Server 2019+',
  'Docker Desktop instalado y corriendo',
  'Permisos de administrador',
  'Puerto 80 disponible',
])

doc.moveDown()
subTitle('12.2 Pasos de Instalación')

normalText('PASO 1: Preparar archivos')
codeBlock(`1. Copiar GeneradorControl-Instalador.zip al servidor
2. Descomprimir en una carpeta (ej: C:\\GeneradorApp)
3. Abrir PowerShell como Administrador
4. Navegar a la carpeta: cd C:\\GeneradorApp`)

normalText('PASO 2: Ejecutar instalación')
codeBlock(`.\\instalar.ps1`)

normalText('El script realiza automáticamente:')
bulletList([
  'Verifica que Docker esté corriendo',
  'Carga las imágenes desde archivos .tar',
  'Crea la red de Docker',
  'Inicia los contenedores',
  'Verifica que los servicios estén activos',
])

normalText('PASO 3: Verificar instalación')
codeBlock(`# Ver contenedores activos
docker ps

# Ver logs del backend
docker-compose logs backend

# Ver logs del frontend
docker-compose logs frontend`)

normalText('PASO 4: Acceder a la aplicación')
bulletList(['Abrir navegador', 'Ir a http://localhost', 'Crear usuario inicial en primer acceso'])

doc.moveDown()
subTitle('12.3 Configuración Post-Instalación')

normalText('1. Configurar placa MQTT:')
bulletList([
  'Ir a Configuración en el menú lateral',
  'Ingresar IP de la placa Dingtian',
  'Ingresar ID de la placa',
  'Configurar dirección del broker MQTT',
  'Guardar cambios',
])

normalText('2. Verificar conexión:')
bulletList([
  'El indicador "Estado Placa" debe mostrar "Conectada"',
  'El indicador "Estado Broker" debe mostrar "Conectado"',
])

// SECCIÓN 13: TROUBLESHOOTING
doc.addPage()
sectionTitle('13. Troubleshooting')

subTitle('13.1 Problemas Comunes')

normalText('❌ El frontend no conecta con el backend')
bulletList([
  'Verificar que el backend esté corriendo: docker ps',
  'Revisar logs: docker-compose logs backend',
  'Verificar FRONTEND_ORIGIN en variables de entorno',
])

doc.moveDown()
normalText('❌ WebSocket se desconecta frecuentemente')
bulletList([
  'Verificar conectividad de red',
  'El sistema tiene reconexión automática',
  'Revisar logs del backend para errores',
])

doc.moveDown()
normalText('❌ La placa Dingtian no responde')
bulletList([
  'Verificar IP del broker MQTT',
  'Comprobar ID de placa correcto',
  'Revisar credenciales MQTT',
  'Verificar conectividad de red con el broker',
])

doc.moveDown()
normalText('❌ Error al exportar PDF')
bulletList([
  'Verificar que haya registros en el historial',
  'Filtros de fecha en formato correcto',
  'Revisar consola del navegador',
])

doc.moveDown()
normalText('❌ Docker no inicia los contenedores')
bulletList([
  'Verificar que Docker Desktop esté corriendo',
  'Comprobar puertos disponibles (80, 8099, 27017)',
  'Revisar logs: docker-compose logs -f',
])

doc.moveDown()
subTitle('13.2 Comandos Útiles')

codeBlock(`# Ver todos los contenedores
docker ps -a

# Reiniciar servicios
docker-compose restart

# Ver logs en tiempo real
docker-compose logs -f

# Detener todos los servicios
docker-compose down

# Eliminar volúmenes (¡CUIDADO! Borra datos)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache`)

// SECCIÓN 14: SEGURIDAD
doc.addPage()
sectionTitle('14. Seguridad')

subTitle('14.1 Medidas Implementadas')
bulletList([
  'Autenticación de usuarios con sesiones',
  'Contraseñas hasheadas con bcrypt',
  'CORS configurado para orígenes permitidos',
  'Imágenes Docker sin código fuente',
  'Usuario no-root en contenedores',
  'Validación de entrada en API',
])

doc.moveDown()
subTitle('14.2 Recomendaciones para Producción')
bulletList([
  'Usar HTTPS con certificado SSL válido',
  'Configurar firewall para puertos necesarios',
  'Cambiar contraseñas por defecto',
  'Montar volumen externo para MongoDB',
  'Configurar backups automáticos de la BD',
  'Mantener Docker y dependencias actualizados',
  'Limitar acceso a la red del broker MQTT',
])

doc.moveDown()
subTitle('14.3 Puertos Utilizados')

const portsTable = [
  ['80', 'TCP', 'Frontend (Nginx)'],
  ['8099', 'TCP', 'Backend API + WebSocket'],
  ['27017', 'TCP', 'MongoDB (interno)'],
  ['1883', 'TCP', 'Broker MQTT (externo)'],
]

simpleTable(['Puerto', 'Protocolo', 'Servicio'], portsTable)

// SECCIÓN 15: MANTENIMIENTO
doc.addPage()
sectionTitle('15. Mantenimiento y Actualizaciones')

subTitle('15.1 Backup de Base de Datos')

codeBlock(`# Backup de MongoDB
docker exec mongo mongodump --out /backup

# Copiar backup a host
docker cp mongo:/backup ./backup-$(date +%Y%m%d)

# Restaurar backup
docker exec mongo mongorestore /backup`)

doc.moveDown()
subTitle('15.2 Actualización del Sistema')

normalText('1. Generar nuevas imágenes en máquina de desarrollo:')
codeBlock('.\\exportar-docker.ps1')

normalText('2. Copiar nuevo ZIP al servidor')

normalText('3. En el servidor, detener servicios:')
codeBlock('docker-compose down')

normalText('4. Cargar nuevas imágenes:')
codeBlock(`docker load -i generador-backend.tar
docker load -i generador-frontend.tar`)

normalText('5. Iniciar servicios:')
codeBlock('docker-compose up -d')

doc.moveDown()
subTitle('15.3 Limpieza de Historial')

normalText('Desde la interfaz web:')
bulletList([
  'Ir a Historial en el menú lateral',
  'Click en "Limpiar Historial"',
  'Confirmar eliminación',
])

normalText('Desde la línea de comandos:')
codeBlock(`# Conectar a MongoDB
docker exec -it mongo mongosh

# Seleccionar base de datos
use generator

# Eliminar historial
db.activity_logs.deleteMany({})

# Verificar
db.activity_logs.countDocuments()`)

// PÁGINA FINAL
doc.addPage()
doc.moveDown(5)
doc.fontSize(24).fillColor(colors.primary).text('Fin del Documento', { align: 'center' })

doc.moveDown(2)
doc
  .fontSize(14)
  .fillColor(colors.dark)
  .text('Sistema de Control Remoto de Generador', { align: 'center' })
doc.text('Versión 2.0.0 - Diciembre 2024', { align: 'center' })

doc.moveDown(3)
doc.fontSize(12).text('Para soporte técnico contactar:', { align: 'center' })
doc.moveDown(0.5)
doc
  .fillColor(colors.secondary)
  .text('GitHub: github.com/Oguri-Dev/remote-generator', { align: 'center' })

doc.moveDown(4)
doc
  .fontSize(10)
  .fillColor(colors.dark)
  .text('© 2024 Oguri-Dev - Todos los derechos reservados', { align: 'center' })

// Finalizar documento
doc.end()

console.log(`\n✅ PDF generado exitosamente: ${outputPath}`)
console.log('📄 Tamaño aproximado: ~15-20 páginas')
