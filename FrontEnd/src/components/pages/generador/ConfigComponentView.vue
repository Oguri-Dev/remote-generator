<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { api } from '/@src/services/apiUser'
import { useNotyf } from '/@src/composable/useNotyf'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useRouter } from 'vue-router'
import type { VTagColor } from '/@src/components/base/tags/VTag.vue'

const router = useRouter()
const notyf = useNotyf()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Configuración')

const loading = ref(false)
const saving = ref(false)

// Tipos de relay disponibles
const relayTypes: Array<{ value: string; label: string; icon: string; color: VTagColor }> = [
  { value: 'generador', label: 'Generador', icon: 'feather:zap', color: 'warning' },
  { value: 'rack', label: 'Rack Monitoreo', icon: 'feather:server', color: 'info' },
  { value: 'modulo', label: 'Módulo', icon: 'feather:box', color: 'success' },
  { value: 'manual', label: 'Modo Manual', icon: 'feather:hand', color: 'danger' },
  { value: 'disabled', label: 'Deshabilitado', icon: 'feather:x-circle', color: 'light' },
]

interface RelayConfig {
  id: string
  name: string
  type: string
  enabled: boolean
  invert_state?: boolean
  input_id?: string
  restart_delay_sec?: number
}

// estado actual y copia base para detectar cambios
const form = reactive({
  ipplaca: '',
  idplaca: 0 as number | string,
  ipbroker: '',
  usermqtt: '',
  passmqtt: '',
  topic: '',
  start_sequence_delay_sec: 5 as number | string,
  stop_sequence_delay_sec: 5 as number | string,
  emergency_input_id: '',
  emergency_input_state: 'LOW' as string,
  relay_manual: '8',
  manual_mode_detection: 'auto' as 'input' | 'auto',
  relays: [] as RelayConfig[],
  // Cámara IP (opcional)
  camara_enabled: false,
  camara_rtsp: '',
  camara_user: '',
  camara_pass: '',
})

let baseSnapshot: any = {}

// Marca si hay una contraseña guardada en el backend para cada campo secreto
// (se usa para mostrar el placeholder "sin cambios" en los inputs).
const hasSavedSecret = reactive<Record<string, boolean>>({
  passmqtt: false,
  camara_pass: false,
})

// Configuración por defecto de los 8 relays
const defaultRelays: RelayConfig[] = [
  { id: '1', name: 'Generador', type: 'generador', enabled: true, invert_state: false, input_id: '1', restart_delay_sec: 0 },
  { id: '2', name: 'Rack Monitoreo', type: 'rack', enabled: true, invert_state: false, input_id: '2', restart_delay_sec: 5 },
  { id: '3', name: 'Módulo 1', type: 'modulo', enabled: true, invert_state: false, input_id: '3', restart_delay_sec: 5 },
  { id: '4', name: 'Módulo 2', type: 'modulo', enabled: true, invert_state: false, input_id: '4', restart_delay_sec: 5 },
  { id: '5', name: 'Relay 5', type: 'disabled', enabled: false, invert_state: false, input_id: '', restart_delay_sec: 0 },
  { id: '6', name: 'Relay 6', type: 'disabled', enabled: false, invert_state: false, input_id: '', restart_delay_sec: 0 },
  { id: '7', name: 'Relay 7', type: 'disabled', enabled: false, invert_state: false, input_id: '', restart_delay_sec: 0 },
  { id: '8', name: 'Modo Manual', type: 'manual', enabled: false, invert_state: false, input_id: '8', restart_delay_sec: 0 },
]

// compara estado actual vs base
const isDirty = computed(() => {
  const a = {
    ...form,
    idplaca: Number(form.idplaca),
    start_sequence_delay_sec: Number(form.start_sequence_delay_sec),
    stop_sequence_delay_sec: Number(form.stop_sequence_delay_sec),
  }
  const b = {
    ...baseSnapshot,
    idplaca: Number(baseSnapshot.idplaca),
    start_sequence_delay_sec: Number(baseSnapshot.start_sequence_delay_sec),
    stop_sequence_delay_sec: Number(baseSnapshot.stop_sequence_delay_sec),
  }
  return JSON.stringify(a) !== JSON.stringify(b)
})

// Obtener el icono y color según el tipo
function getRelayTypeInfo(type: string) {
  return relayTypes.find(t => t.value === type) || relayTypes[4]
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/config')

    // Si no tiene relays, usar defaults
    if (!data.relays || data.relays.length === 0) {
      data.relays = JSON.parse(JSON.stringify(defaultRelays))
    }

    Object.assign(form, data)

    // El backend nunca envía contraseñas en claro: manda un centinela
    // (__SECRET_SET__) si hay una guardada. Lo convertimos en campo vacío para
    // que el input muestre el placeholder "sin cambios". Si el usuario lo deja
    // vacío al guardar, el backend conserva la contraseña existente.
    const SECRET_SENTINEL = '__SECRET_SET__'
    const secretFields = ['passmqtt', 'camara_pass'] as const
    for (const f of secretFields) {
      hasSavedSecret[f] = data[f] === SECRET_SENTINEL
      if (data[f] === SECRET_SENTINEL) form[f] = ''
    }

    // Defaults para delays de secuencia si vienen vacíos
    if (!form.start_sequence_delay_sec && form.start_sequence_delay_sec !== 0) {
      form.start_sequence_delay_sec = 5
    }
    if (!form.stop_sequence_delay_sec && form.stop_sequence_delay_sec !== 0) {
      form.stop_sequence_delay_sec = 5
    }
    // El snapshot se basa en `form` (ya con los centinelas convertidos a vacío)
    // para que isDirty no se dispare por la diferencia centinela/vacío.
    const normalizedSnapshot = {
      ...form,
      start_sequence_delay_sec: form.start_sequence_delay_sec,
      stop_sequence_delay_sec: form.stop_sequence_delay_sec,
    }
    baseSnapshot = JSON.parse(JSON.stringify(normalizedSnapshot))
  } catch (e: any) {
    if (e?.response?.status === 401) {
      notyf.error('Sesión expirada. Inicia sesión de nuevo.')
      router.push('/auth/login')
    } else {
      notyf.error(obtenerMensajeError(e, 'No pude obtener la configuración'))
    }
  } finally {
    loading.value = false
  }
}

function normalizarPayload() {
  return {
    ipplaca: String(form.ipplaca || '').trim(),
    idplaca: Number(form.idplaca) || 0,
    ipbroker: String(form.ipbroker || '').trim(),
    usermqtt: String(form.usermqtt || '').trim(),
    passmqtt: String(form.passmqtt || ''),
    topic: String(form.topic || '').trim(),
    start_sequence_delay_sec: Number(form.start_sequence_delay_sec) || 0,
    stop_sequence_delay_sec: Number(form.stop_sequence_delay_sec) || 0,
    emergency_input_id: String(form.emergency_input_id || '').trim(),
    emergency_input_state: String(form.emergency_input_state || 'LOW').trim(),
    relay_manual: String(form.relay_manual || '8').trim(),
    manual_mode_detection: form.manual_mode_detection || 'auto',
    relays: form.relays.map(r => ({
      id: r.id,
      name: r.name.trim(),
      type: r.type,
      enabled: r.type !== 'disabled',
      invert_state: r.invert_state || false,
      input_id: r.input_id || '',
      restart_delay_sec: Number(r.restart_delay_sec) || 0,
    })),
    camara_enabled: !!form.camara_enabled,
    camara_rtsp: String(form.camara_rtsp || '').trim(),
    camara_user: String(form.camara_user || '').trim(),
    camara_pass: String(form.camara_pass || ''),
  }
}

async function save() {
  if (!isDirty.value) return
  saving.value = true
  try {
    const payload = normalizarPayload()
    await api.put('/config', payload)
    baseSnapshot = JSON.parse(JSON.stringify(payload))
    Object.assign(form, payload)
    notyf.success('Configuración guardada')
  } catch (e: any) {
    if (e?.response?.status === 401) {
      notyf.error('Sesión expirada. Inicia sesión de nuevo.')
      router.push('/auth/login')
    } else {
      notyf.error(obtenerMensajeError(e, 'Error al guardar'))
    }
  } finally {
    saving.value = false
  }
}

function resetCambios() {
  Object.assign(form, JSON.parse(JSON.stringify(baseSnapshot)))
}

function obtenerMensajeError(e: any, fallback: string) {
  return e?.response?.data?.error || e?.message || fallback
}

// Actualizar enabled cuando cambia el tipo
function onTypeChange(relay: RelayConfig) {
  relay.enabled = relay.type !== 'disabled'
}

// Watch para actualizar enabled automáticamente cuando cambia el tipo
watch(
  () => form.relays.map(r => r.type),
  (newTypes, oldTypes) => {
    if (!oldTypes) return
    form.relays.forEach((relay, i) => {
      if (newTypes[i] !== oldTypes[i]) {
        relay.enabled = relay.type !== 'disabled'
      }
    })
  },
  { deep: true }
)

onMounted(load)
</script>

<template>
  <div class="page-content-inner">
    <div class="columns is-centered">
      <div class="column is-10-widescreen is-10-desktop is-12-tablet">
        <!-- Card de Configuración General -->
        <div class="card mb-5">
          <div class="card-header">
            <p class="card-header-title">
              <span class="icon mr-2"><i class="feather:settings"></i></span>
              Configuración General
            </p>
          </div>
          <div class="card-content">
            <VField label="IP de la placa">
              <VControl icon="feather:cpu">
                <VInput v-model="form.ipplaca" placeholder="192.168.0.10" />
              </VControl>
            </VField>
            <VField label="ID de la placa">
              <VControl icon="feather:hash">
                <VInput v-model.number="form.idplaca" type="number" placeholder="1" />
              </VControl>
            </VField>

            <VField label="IP del broker MQTT local">
              <VControl icon="feather:server">
                <VInput v-model="form.ipbroker" placeholder="192.168.0.20:1883" />
              </VControl>
              <p class="help">Broker MQTT en la red local (ej: 192.168.0.20:1883)</p>
            </VField>

            <div class="columns">
              <div class="column">
                <VField label="Usuario MQTT">
                  <VControl icon="feather:user">
                    <VInput v-model="form.usermqtt" placeholder="mqtt_user" />
                  </VControl>
                </VField>
              </div>
              <div class="column">
                <VField label="Contraseña MQTT">
                  <VControl icon="feather:lock">
                    <VInput v-model="form.passmqtt" type="password" :placeholder="hasSavedSecret.passmqtt ? '•••••• (sin cambios)' : 'Sin configurar'" />
                  </VControl>
                </VField>
              </div>
            </div>
            <VField label="Tópico MQTT">
              <VControl icon="feather:hash">
                <VInput v-model="form.topic" placeholder="/dingtian/relay8721/out/#" />
              </VControl>
            </VField>

            <div class="columns">
              <div class="column">
                <VField label="Delay entre pasos de encendido (seg)">
                  <VControl icon="feather:clock">
                    <VInput v-model.number="form.start_sequence_delay_sec" type="number" min="0" step="1"
                      placeholder="5" />
                  </VControl>
                  <p class="help">Tiempo de espera entre cada paso al ENCENDER (generador → racks → módulos).</p>
                </VField>
              </div>
              <div class="column">
                <VField label="Delay entre pasos de apagado (seg)">
                  <VControl icon="feather:clock">
                    <VInput v-model.number="form.stop_sequence_delay_sec" type="number" min="0" step="1"
                      placeholder="5" />
                  </VControl>
                  <p class="help">Tiempo de espera entre cada paso al APAGAR (módulos → racks → generador).</p>
                </VField>
              </div>
            </div>
          </div>
        </div>

        <!-- Card de Configuración de Relays -->
        <div class="card">
          <div class="card-header">
            <p class="card-header-title">
              <span class="icon mr-2"><i class="feather:grid"></i></span>
              Configuración de Relays
            </p>
          </div>
          <div class="card-content">
            <p class="subtitle is-6 mb-4">
              Configura el tipo y nombre de cada relay. Los relays deshabilitados no se mostrarán en el panel principal.
            </p>

            <div class="relay-grid">
              <div v-for="relay in form.relays" :key="relay.id" class="relay-card"
                :class="{ 'is-disabled-visual': relay.type === 'disabled' }">
                <div class="relay-header">
                  <span class="relay-id">Relay {{ relay.id }}</span>
                  <VTag :color="getRelayTypeInfo(relay.type).color" :label="getRelayTypeInfo(relay.type).label"
                    rounded />
                </div>

                <VField label="Nombre">
                  <VControl>
                    <VInput v-model="relay.name" :placeholder="`Relay ${relay.id}`"
                      :disabled="relay.type === 'disabled'" />
                  </VControl>
                </VField>

                <VField label="Tipo">
                  <div class="select is-fullwidth">
                    <select v-model="relay.type">
                      <option v-for="type in relayTypes" :key="type.value" :value="type.value">
                        {{ type.label }}
                      </option>
                    </select>
                  </div>
                </VField>

                <VField>
                  <VControl>
                    <VCheckbox v-model="relay.invert_state" label="Invertir estado (cableado invertido)" />
                  </VControl>
                </VField>

                <VField label="Input de estado (sensor físico)">
                  <div class="select is-fullwidth">
                    <select v-model="relay.input_id">
                      <option value="">Ninguno (sin sensor)
                      </option>
                      <option v-for="i in 8" :key="i" :value="String(i)">
                        Input {{ i }}
                      </option>
                    </select>
                  </div>
                  <p class="help">
                    Selecciona qué input físico monitorea el estado real de este relay.
                  </p>
                </VField>

                <VField label="Segundos de reinicio (OFF antes de ON)">
                  <VControl icon="feather:repeat">
                    <VInput v-model.number="relay.restart_delay_sec" type="number" min="0" step="1" placeholder="5"
                      :disabled="relay.type === 'disabled'" />
                  </VControl>
                  <p class="help">Tiempo que permanecerá apagado al hacer restart de este relay.</p>
                </VField>
              </div>
            </div>

            <!-- Relay Manual -->
            <div class="mt-5">
              <VField label="Detección de Modo Manual">
                <VControl>
                  <div class="select is-fullwidth">
                    <select v-model="form.manual_mode_detection">
                      <option value="auto">Automática (por lógica)</option>
                      <option value="input">Sensor físico (input dedicado)</option>
                    </select>
                  </div>
                </VControl>
              </VField>
              <p class="help">
                <strong>Automática:</strong> Detecta modo manual cuando el generador está OFF pero los componentes
                tienen energía.<br>
                <strong>Sensor físico:</strong> Usa el input configurado abajo.
              </p>

              <VField v-if="form.manual_mode_detection === 'input'" label="Input para Modo Manual (sensor de estado)"
                class="mt-3">
                <VControl icon="feather:hand">
                  <VSelect v-model="form.relay_manual">
                    <option v-for="i in 8" :key="i" :value="String(i)">
                      Input {{ i }}
                    </option>
                  </VSelect>
                </VControl>
              </VField>

              <!-- Parada de Emergencia -->
              <div class="mt-4">
                <VField label="Parada de Emergencia (input)">
                  <VControl icon="feather:alert-triangle">
                    <div class="select is-fullwidth">
                      <select v-model="form.emergency_input_id">
                        <option value="">Sin configurar</option>
                        <option v-for="i in 8" :key="i" :value="String(i)">
                          Input {{ i }}
                        </option>
                      </select>
                    </div>
                  </VControl>
                  <p class="help">
                    Selecciona el input que activará la parada de emergencia.
                  </p>
                </VField>

                <VField v-if="form.emergency_input_id" label="Activación por estado">
                  <VControl>
                    <div class="select is-fullwidth">
                      <select v-model="form.emergency_input_state">
                        <option value="LOW">LOW (Input activo/LOW = Emergencia)</option>
                        <option value="HIGH">HIGH (Input inactivo/HIGH = Emergencia)</option>
                      </select>
                    </div>
                  </VControl>
                  <p class="help">
                    Indica en qué estado del input se activa la parada de emergencia.
                  </p>
                </VField>
              </div>
            </div>

            <!-- Cámara IP (opcional) -->
            <hr class="my-4" />
            <h3 class="title is-5 mb-3">
              <span class="icon-text">
                <span class="icon"><i class="iconify" data-icon="feather:video"></i></span>
                <span>Cámara IP (opcional)</span>
              </span>
            </h3>

            <VField>
              <VControl>
                <VCheckbox v-model="form.camara_enabled" label="Habilitar cámara en vivo" />
              </VControl>
              <p class="help">
                Si se habilita, podrás ver el video en el panel principal con el botón de cámara de la barra superior.
              </p>
            </VField>

            <template v-if="form.camara_enabled">
              <VField label="URL RTSP de la cámara">
                <VControl icon="feather:video">
                  <VInput v-model="form.camara_rtsp" placeholder="rtsp://192.168.1.50:554/Streaming/Channels/101" />
                </VControl>
                <p class="help">URL RTSP (Hikvision: rtsp://IP:554/Streaming/Channels/101 para el canal principal).</p>
              </VField>
              <div class="columns">
                <div class="column">
                  <VField label="Usuario de la cámara">
                    <VControl icon="feather:user">
                      <VInput v-model="form.camara_user" placeholder="admin" />
                    </VControl>
                  </VField>
                </div>
                <div class="column">
                  <VField label="Contraseña de la cámara">
                    <VControl icon="feather:lock">
                      <VInput v-model="form.camara_pass" type="password" :placeholder="hasSavedSecret.camara_pass ? '•••••• (sin cambios)' : 'Sin configurar'" />
                    </VControl>
                  </VField>
                </div>
              </div>
            </template>

            <!-- Botones de acción -->
            <div class="is-flex is-justify-content-end mt-5">
              <div class="buttons">
                <VButton :loading="loading" :disabled="loading" @click="load" icon="feather:refresh-ccw">
                  Recargar
                </VButton>
                <VButton color="light" :disabled="!isDirty" @click="resetCambios">
                  Descartar cambios
                </VButton>
                <VButton color="primary" :loading="saving" :disabled="!isDirty || saving" @click="save"
                  icon="feather:save">
                  Guardar cambios
                </VButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.relay-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.relay-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--light-box-shadow);
  }

  &.is-disabled-visual {
    opacity: 0.7;
    background: var(--fade-grey-light-2);
    /* NO usar pointer-events: none aquí */
  }
}

.relay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.relay-id {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--dark-text);
}

.card-header {
  background: var(--fade-grey-light-2);
  border-bottom: 1px solid var(--border);
}

.card-header-title {
  display: flex;
  align-items: center;
}

/* Dark mode */
.is-dark {
  .card {
    background: var(--dark-sidebar-light-2);
    border: 1px solid var(--dark-sidebar-light-12);
  }

  .card-header {
    background: var(--dark-sidebar-light-4);
    border-bottom: 1px solid var(--dark-sidebar-light-12);
  }

  .card-header-title {
    color: var(--dark-dark-text);
  }

  .relay-card {
    background: var(--dark-sidebar-light-4);
    border-color: var(--dark-sidebar-light-12);

    &.is-disabled-visual {
      background: var(--dark-sidebar-light-2);
    }
  }

  .relay-header {
    border-bottom-color: var(--dark-sidebar-light-12);
  }

  .relay-id {
    color: var(--dark-dark-text);
  }

  input,
  .input,
  select,
  .select select {
    background: var(--dark-sidebar);
    color: var(--dark-dark-text);
    border-color: var(--dark-sidebar-light-12);
  }

  .help {
    color: var(--dark-sidebar-light-20);
  }
}
</style>
