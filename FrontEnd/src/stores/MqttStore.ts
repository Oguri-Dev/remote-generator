import { defineStore } from 'pinia'
import { usePlacaStore } from './PlacaStore'

export const useMqttStore = defineStore('mqttStore', {
  state: () => ({
    isConnected: false,
    websocket: null as WebSocket | null,
    sequenceState: {
      '1': '', // Generador
      '2': '', // Rack Monitoreo
      '3': '', // Módulo 1
      '4': '', // Módulo 2
    } as Record<string, string>,
  }),

  actions: {
    // Obtener la URL base (IP o 'localhost') del backend
    getBaseURL() {
      // host/IP visible para el navegador (localhost:3069 en dev con proxy; dominio:puerto en prod)
      return `${window.location.hostname}`
    },

    connectToWebSocket() {
      if (this.websocket && this.isConnected) return

      // Construye URL robusta: respeta http/https y evita hardcodear puertos si usas proxy
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const wsUrl = `${protocol}://${window.location.host}/ws`
      // Si NO usas proxy y el back está separado en 8099:
      // const wsUrl = `${protocol}://${this.getBaseURL()}:8099/ws`;

      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        this.isConnected = true
        console.log('✅ WebSocket conectado')

        // Iniciar monitoreo de heartbeat de la placa
        const placaStore = usePlacaStore()
        placaStore.startHeartbeatMonitoring()
      }

      this.websocket.onmessage = (event) => {
        let data: any
        try {
          data = JSON.parse(event.data)
        } catch {
          // Si llegara texto plano
          data = { topic: '/raw', message: event.data }
        }

        // 1) Estado de secuencia emitido por el back
        if (data.topic === '/mqtt/sequence_state') {
          if (data.message && typeof data.message === 'object') {
            // mergea sólo las claves conocidas
            this.sequenceState = { ...this.sequenceState, ...data.message }
          }
          return
        }

        // 2) Mensajes normales de la placa (ip, mac, relay, etc.)
        const placaStore = usePlacaStore()
        const msgAsString =
          typeof data.message === 'object'
            ? JSON.stringify(data.message)
            : String(data.message)

        placaStore.updatePlacaData(data.topic, msgAsString)
      }

      this.websocket.onclose = () => {
        console.warn('⚠️ WebSocket desconectado. Reintentando...')
        this.isConnected = false

        // Detener monitoreo de heartbeat cuando se cierra la conexión
        const placaStore = usePlacaStore()
        placaStore.stopHeartbeatMonitoring()

        setTimeout(() => this.connectToWebSocket(), 10000)
      }

      this.websocket.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error)
        this.websocket?.close()
      }
    },

    async fetchSequenceState() {
      try {
        const response = await fetch('/mqtt/sequence_state')
        const data = await response.json()

        if (data.sequenceState && typeof data.sequenceState === 'object') {
          this.sequenceState = data.sequenceState
        } else {
          console.warn('⚠️ Respuesta inesperada del backend:', data)
        }
      } catch (error) {
        console.error('❌ Error obteniendo estado de secuencia:', error)
      }
    },
  },
})
