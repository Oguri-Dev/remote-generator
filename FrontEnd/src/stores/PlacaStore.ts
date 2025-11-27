import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlacaStore = defineStore('placaStore', {
  state: () => ({
    relays: {} as Record<string, string>,
    inputs: {} as Record<string, string>,
    ip: '',
    mac: '',
    serialNumber: '',
    relayCount: 0,
    inputCount: 0,
    lastMessageTime: ref(Date.now()), // ⏳ Usa `ref()` para reactividad real
    connectionStatus: ref<'Desconectada' | 'Intentando conexión' | 'Conectada'>(
      'Desconectada'
    ),
    heartbeatInterval: null as number | null, // Intervalo para verificar conexión
  }),

  actions: {
    // Iniciar monitoreo de heartbeat
    startHeartbeatMonitoring() {
      // Evitar múltiples intervalos
      if (this.heartbeatInterval) return

      // Verificar cada 1 segundo
      this.heartbeatInterval = window.setInterval(() => {
        this.checkConnection()
      }, 1000)
    },

    // Detener monitoreo
    stopHeartbeatMonitoring() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }
    },

    updatePlacaData(topic: string, message: string) {
      this.lastMessageTime = Date.now() // 🔄 Actualiza la última actividad

      // 🔥 Actualizar estado solo si cambió
      if (this.connectionStatus !== 'Conectada') {
        this.connectionStatus = 'Conectada'
      }

      if (topic.includes('/out/relay')) {
        const parsedMessage = JSON.parse(message)
        const idx = parsedMessage.idx?.toString()
        if (idx) this.relays[idx] = parsedMessage.status
      } else if (topic.includes('/ip')) {
        this.ip = message
      } else if (topic.includes('/mac')) {
        this.mac = message
      } else if (topic.includes('/out/sn')) {
        this.serialNumber = message
      } else if (topic.includes('/input_cnt')) {
        this.inputCount = parseInt(message) || 0
      }
    },

    checkConnection() {
      const now = Date.now()
      const timeSinceLastMessage = now - this.lastMessageTime

      if (timeSinceLastMessage <= 5000) {
        // ✅ Menos de 5s: Conectada (heartbeat cada 5s)
        this.connectionStatus = 'Conectada'
      } else if (timeSinceLastMessage <= 10000) {
        // 🔄 Entre 5-10s: Intentando conexión (perdió 1 heartbeat)
        if (this.connectionStatus !== 'Intentando conexión') {
          this.connectionStatus = 'Intentando conexión'
        }
      } else {
        // 🛑 Más de 10s (perdió 2+ heartbeats): Desconectada
        if (this.connectionStatus !== 'Desconectada') {
          this.connectionStatus = 'Desconectada'
        }
      }
    },
  },
})
