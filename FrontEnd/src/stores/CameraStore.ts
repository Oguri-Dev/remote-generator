import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '/@src/services/apiUser'

// Endpoint WHEP de la cámara, SIEMPRE relativo al host que sirve la web.
// nginx proxea /whep/ hacia MediaMTX, por lo que esto funciona en cualquier
// IP/segmento sin reconstruir el frontend. El path "generador" lo fija el
// backend (camera.PathName). Resultado: <host>/whep/generador/whep.
const CAM_PATH = 'generador'

export const useCameraStore = defineStore('camera', () => {
  // ¿Hay una cámara configurada y habilitada en el backend?
  const configured = ref(false)
  // ¿El usuario activó la transmisión con el toggle de la barra?
  const active = ref(false)
  // Contador que fuerza la reconexión del reproductor (toggle = cortar/reconectar).
  const reconnectNonce = ref(0)

  const whepUrl = computed(() => `/whep/${CAM_PATH}/whep`)

  // Lee la config para saber si la cámara está habilitada.
  async function refreshConfigured() {
    try {
      const { data } = await api.get('/config')
      configured.value = !!data.camara_enabled && !!data.camara_rtsp
      // Si dejó de estar configurada, apagar la transmisión.
      if (!configured.value) active.value = false
    } catch {
      configured.value = false
    }
  }

  // El toggle: si está activa la corta; si está inactiva la (re)conecta.
  function toggle() {
    if (active.value) {
      active.value = false
    } else {
      active.value = true
      reconnectNonce.value++ // fuerza una conexión fresca
    }
  }

  function stop() {
    active.value = false
  }

  return { configured, active, reconnectNonce, whepUrl, refreshConfigured, toggle, stop }
})
