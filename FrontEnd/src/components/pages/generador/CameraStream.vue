<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useCameraStore } from '/@src/stores/CameraStore'

const camera = useCameraStore()
const videoEl = ref<HTMLVideoElement | null>(null)
const status = ref<'idle' | 'connecting' | 'playing' | 'error'>('idle')
const errorMsg = ref('')

let pc: RTCPeerConnection | null = null
let abort: AbortController | null = null

const statusLabel = computed(() => {
  switch (status.value) {
    case 'connecting': return 'Conectando…'
    case 'playing': return 'En vivo'
    case 'error': return errorMsg.value || 'Sin señal'
    default: return 'Detenida'
  }
})

// Cierra la conexión WebRTC y libera el vídeo.
function teardown() {
  if (abort) {
    abort.abort()
    abort = null
  }
  if (pc) {
    pc.getReceivers().forEach((r) => r.track?.stop())
    pc.close()
    pc = null
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
  status.value = 'idle'
}

// Establece la conexión WebRTC con MediaMTX usando el protocolo WHEP.
async function connect() {
  const el = videoEl.value
  if (!el) return
  teardown()
  status.value = 'connecting'
  errorMsg.value = ''
  abort = new AbortController()

  try {
    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    // Solo recibimos vídeo (y audio si lo hubiera); no enviamos nada.
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })

    // Cuando llega el track remoto, lo conectamos al elemento <video>.
    pc.ontrack = (event) => {
      el.srcObject = event.streams[0]
      el.play().catch(() => { /* autoplay puede requerir interacción */ })
      status.value = 'playing'
    }

    pc.onconnectionstatechange = () => {
      if (!pc) return
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        status.value = 'error'
        errorMsg.value = 'Conexión perdida'
      }
    }

    // 1) Crear oferta SDP local.
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // 2) Enviar la oferta al endpoint WHEP de MediaMTX.
    const res = await fetch(camera.whepUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: offer.sdp,
      signal: abort.signal,
    })
    if (!res.ok) {
      throw new Error(`WHEP ${res.status}`)
    }

    // 3) Aplicar la respuesta SDP del servidor.
    const answer = await res.text()
    await pc.setRemoteDescription({ type: 'answer', sdp: answer })
  } catch (e: any) {
    if (e?.name === 'AbortError') return // cancelado a propósito
    status.value = 'error'
    errorMsg.value = 'No se pudo conectar a la cámara'
    teardown()
    status.value = 'error'
  }
}

// Conectar al montar (el componente se monta cuando el toggle ya está activo).
onMounted(async () => {
  await nextTick()
  if (camera.active) connect()
})

// Reaccionar a cambios del toggle (active) y a la orden de reconexión (nonce).
watch(
  () => [camera.active, camera.reconnectNonce] as const,
  async ([active]) => {
    await nextTick()
    if (active) connect()
    else teardown()
  }
)

onBeforeUnmount(teardown)
</script>

<template>
  <div class="camera-stream dashboard-card">
    <div class="camera-header">
      <h3 class="dark-inverted">
        <span class="icon-text">
          <span class="icon"><i class="iconify" data-icon="feather:video" /></span>
          <span>Cámara del Generador</span>
        </span>
      </h3>
      <span class="camera-status" :class="`is-${status}`">{{ statusLabel }}</span>
    </div>

    <div class="camera-frame">
      <video ref="videoEl" muted playsinline autoplay />
      <div v-if="status !== 'playing'" class="camera-overlay">
        <i v-if="status === 'connecting'" class="iconify spin" data-icon="feather:loader" />
        <i v-else class="iconify" data-icon="feather:video-off" />
        <p>{{ statusLabel }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.camera-stream {
  padding: 1rem 1.25rem;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.camera-status {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;

  &.is-playing { color: var(--success); }
  &.is-connecting { color: var(--warning); }
  &.is-error { color: var(--danger); }
  &.is-idle { color: var(--light-text); }
}

.camera-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.camera-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #888;

  i { font-size: 2.5rem; }
  p { font-size: 0.9rem; }

  .spin {
    animation: camera-spin 1s linear infinite;
  }
}

@keyframes camera-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
