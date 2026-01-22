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

      // 🔥 DEBUG: Mostrar todos los tópicos que llegan
      console.log(`📡 MQTT Topic: ${topic}`, `Message:`, message);

      // 🔥 Actualizar estado solo si cambió
      if (this.connectionStatus !== 'Conectada') {
        this.connectionStatus = 'Conectada'
      }

      // Procesar INPUTS (estado real): /out/input1 {"idx":"1","status":"HIGH"}
      // PRIORIDAD: inputs son la fuente de verdad (sensores reales)
      if (topic.includes('/out/input')) {
        try {
          const parsedMessage = JSON.parse(message)
          const idx = parsedMessage.idx?.toString()
          // Guardar SOLO en inputs (estado real del sensor)
          if (idx) {
            this.inputs[idx] = parsedMessage.status
            console.log(`✅ Input[${idx}] actualizado a: ${parsedMessage.status}`);
          }
        } catch (e) {
          // Si no es JSON, ignorar
          console.warn(`⚠️ Error parseando input JSON:`, e);
        }
      }
      // Procesar formato largo de relays: /out/relay1 {"idx":"1","status":"ON"} (legacy)
      // Solo si NO hay input para este relay (para no sobrescribir)
      else if (topic.includes('/out/relay')) {
        try {
          const parsedMessage = JSON.parse(message)
          const idx = parsedMessage.idx?.toString()
          // Guardar en relays SOLO si no existe input para este índice
          if (idx && !this.inputs[idx]) {
            this.relays[idx] = parsedMessage.status
            console.log(`✅ Relay[${idx}] actualizado a: ${parsedMessage.status} (sin input)`);
          } else if (idx && this.inputs[idx]) {
            console.log(`⏭️ Relay[${idx}] ignorado (input ya existe)`);
          }
        } catch (e) {
          // Si no es JSON, ignorar
          console.warn(`⚠️ Error parseando relay JSON:`, e);
        }
      }
      // Procesar formato corto: /out/r1 ON, /out/r2 OFF, etc. (legacy)
      // Solo si NO hay input para este relay
      else if (topic.match(/\/out\/r\d+$/)) {
        const relayMatch = topic.match(/\/r(\d+)$/)
        if (relayMatch) {
          const idx = relayMatch[1]
          // Guardar SOLO si no existe input para este índice
          if (!this.inputs[idx]) {
            this.relays[idx] = message.trim()
            console.log(`✅ Relay corto[${idx}] actualizado a: ${message.trim()} (sin input)`);
          } else {
            console.log(`⏭️ Relay corto[${idx}] ignorado (input ya existe)`);
          }
        }
      } else if (topic.includes('/ip')) {
        this.ip = message
        console.log(`✅ IP actualizada a: ${message}`);
      } else if (topic.includes('/mac')) {
        this.mac = message
        console.log(`✅ MAC actualizado a: ${message}`);
      } else if (topic.includes('/out/sn')) {
        this.serialNumber = message
        console.log(`✅ Serial actualizado a: ${message}`);
      } else if (topic.includes('/input_cnt')) {
        this.inputCount = parseInt(message) || 0
        console.log(`✅ Input count actualizado a: ${this.inputCount}`);
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
