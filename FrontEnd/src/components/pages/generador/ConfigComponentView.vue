<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'   // <- añade computed
import axios from 'axios'
import { useNotyf } from '/@src/composable/useNotyf'
import { useViewWrapper } from '/@src/stores/viewWrapper'
import { useRouter } from 'vue-router'

const router = useRouter()
const notyf = useNotyf()
const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Configuración')

const api = axios.create({ baseURL: '/api', withCredentials: true })

const loading = ref(false)
const saving = ref(false)

// estado actual y copia base para detectar cambios
const form = reactive({
  ipplaca: '',
  idplaca: 0 as number | string,
  ipbroker: '',
  usermqtt: '',
  passmqtt: '',
  topic: '',
  relay_generador: '1',
  relay_rack_monitoreo: '2',
  relay_modulo1: '3',
  relay_modulo2: '4',
})
let baseSnapshot: any = {} // última versión cargada desde el server

// compara estado actual vs base
const isDirty = computed(() => {
  const a = { ...form, idplaca: Number(form.idplaca) }
  const b = { ...baseSnapshot, idplaca: Number(baseSnapshot.idplaca) }
  return JSON.stringify(a) !== JSON.stringify(b)
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/config')
    Object.assign(form, data || {})
    baseSnapshot = JSON.parse(JSON.stringify(data || {})) // deep copy para comparación
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
    passmqtt: String(form.passmqtt || ''), // no trim si admites espacios
    topic: String(form.topic || '').trim(),
    relay_generador: String(form.relay_generador || '1').trim(),
    relay_rack_monitoreo: String(form.relay_rack_monitoreo || '2').trim(),
    relay_modulo1: String(form.relay_modulo1 || '3').trim(),
    relay_modulo2: String(form.relay_modulo2 || '4').trim(),
  }
}

async function save() {
  if (!isDirty.value) return
  saving.value = true
  try {
    const payload = normalizarPayload()
    await api.put('/config', payload)
    baseSnapshot = JSON.parse(JSON.stringify(payload))
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

onMounted(load)
</script>

<template>
  <div class="page-content-inner">
    <div class="columns is-centered">
      <div class="column is-10-widescreen is-10-desktop is-12-tablet">
        <div class="card">
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
            <VField label="IP del broker MQTT">
              <VControl icon="feather:server">
                <VInput v-model="form.ipbroker" placeholder="192.168.0.20" />
              </VControl>
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
                    <VInput v-model="form.passmqtt" type="password" placeholder="••••••" />
                  </VControl>
                </VField>
              </div>
            </div>
            <VField label="Tópico MQTT">
              <VControl icon="feather:hash">
                <VInput v-model="form.topic" placeholder="omni/generador/acciones" />
              </VControl>
            </VField>

            <!-- Mapeo de Relays -->
            <div class="mt-5 mb-4">
              <h3 class="title is-5">Mapeo de Relays</h3>
              <p class="subtitle is-6 mb-4">Asigna qué ID de relay de la placa controla cada función</p>
            </div>

            <div class="columns">
              <div class="column is-6">
                <VField label="Relay Generador">
                  <VControl icon="feather:zap">
                    <VInput v-model="form.relay_generador" placeholder="1" />
                  </VControl>
                </VField>
              </div>
              <div class="column is-6">
                <VField label="Relay Rack Monitoreo">
                  <VControl icon="feather:server">
                    <VInput v-model="form.relay_rack_monitoreo" placeholder="2" />
                  </VControl>
                </VField>
              </div>
            </div>

            <div class="columns">
              <div class="column is-6">
                <VField label="Relay Módulo 1">
                  <VControl icon="feather:box">
                    <VInput v-model="form.relay_modulo1" placeholder="3" />
                  </VControl>
                </VField>
              </div>
              <div class="column is-6">
                <VField label="Relay Módulo 2">
                  <VControl icon="feather:package">
                    <VInput v-model="form.relay_modulo2" placeholder="4" />
                  </VControl>
                </VField>
              </div>
            </div>

            <div class="is-flex is-justify-content-end">
              <!-- Barra de acciones -->
              <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">

                <div class="buttons">
                  <VButton :loading="loading" :disabled="loading" @click="load" icon="feather:refresh-ccw">
                    Recargar
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
  </div>
</template>


<style lang="scss" scoped>
/* Ajustes generales del card en dark */
.is-dark .card {
  background: var(--dark-sidebar-light-2);
  color: var(--dark-dark-text);
  border: 1px solid var(--border);
}

/* Inputs y controles Vuero dentro del card */
.is-dark .card .field .control,
.is-dark .card .v-field .control {
  --input-bg: var(--dark-sidebar);
  /* fondo input */
  --input-text: var(--dark-dark-text);
  /* texto input */
  --input-border: var(--dark-sidebar-light-12);
  /* bordes suaves */
}

.is-dark input,
.is-dark .input,
.is-dark .textarea {
  background: var(--input-bg);
  color: var(--input-text);
  border-color: var(--input-border);
}

.is-dark .input:focus,
.is-dark .textarea:focus {
  border-color: var(--primary);
  /* usa tu primary ya redefinido en dark */
  box-shadow: 0 0 0 0.125em rgba(0, 0, 0, 0);
  /* sin glow raro */
}

/* Iconos de los inputs */
.is-dark .control .iconify,
.is-dark .control .icon {
  color: var(--dark-sidebar-light-25);
}

/* Botones primarios en dark (si quieres que resalten un poco más) */
.is-dark .button.is-primary {
  background: hsl(var(--primary-h), var(--primary-s), calc(var(--primary-l) + 4%));
  border-color: transparent;
  color: #fff;
}

.is-dark .button.is-primary:hover {
  filter: brightness(1.04);
}

/* Placeholder más visible en dark */
.is-dark ::placeholder {
  color: var(--dark-sidebar-light-30);
  opacity: 1;
}
</style>
