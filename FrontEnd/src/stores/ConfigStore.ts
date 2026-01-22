import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

export interface RelayConfig {
  id: string
  name: string
  type: 'generador' | 'rack' | 'modulo' | 'manual' | 'disabled'
  enabled: boolean
  invert_state: boolean
  input_id: string // ID del input físico que corresponde a este relay ("1"-"8", "" = sin input)
}

export interface Config {
  ipplaca: string
  idplaca: number
  ipbroker: string
  usermqtt: string
  passmqtt: string
  topic: string
  relays: RelayConfig[]
  relay_manual: string
  manual_mode_detection: 'input' | 'auto' // Método de detección: 'input' (sensor físico) o 'auto' (cálculo lógico)
}

const defaultRelays: RelayConfig[] = [
  {
    id: '1',
    name: 'Generador',
    type: 'generador',
    enabled: true,
    invert_state: false,
    input_id: '1',
  },
  {
    id: '2',
    name: 'Rack Monitoreo',
    type: 'rack',
    enabled: true,
    invert_state: false,
    input_id: '2',
  },
  {
    id: '3',
    name: 'Módulo 1',
    type: 'modulo',
    enabled: true,
    invert_state: false,
    input_id: '3',
  },
  {
    id: '4',
    name: 'Módulo 2',
    type: 'modulo',
    enabled: true,
    invert_state: false,
    input_id: '4',
  },
  {
    id: '5',
    name: 'Relay 5',
    type: 'disabled',
    enabled: false,
    invert_state: false,
    input_id: '',
  },
  {
    id: '6',
    name: 'Relay 6',
    type: 'disabled',
    enabled: false,
    invert_state: false,
    input_id: '',
  },
  {
    id: '7',
    name: 'Relay 7',
    type: 'disabled',
    enabled: false,
    invert_state: false,
    input_id: '',
  },
  {
    id: '8',
    name: 'Modo Manual',
    type: 'manual',
    enabled: false,
    invert_state: false,
    input_id: '8',
  },
]

export const useConfigStore = defineStore('configStore', () => {
  const config = ref<Config | null>(null)
  const loading = ref(false)
  const loaded = ref(false)

  // Relays habilitados (excluye disabled)
  const enabledRelays = computed(() => {
    if (!config.value?.relays) return []
    return config.value.relays.filter((r) => r.enabled && r.type !== 'disabled')
  })

  // Relays por tipo
  const generadores = computed(() =>
    enabledRelays.value.filter((r) => r.type === 'generador')
  )

  const racks = computed(() => enabledRelays.value.filter((r) => r.type === 'rack'))

  const modulos = computed(() => enabledRelays.value.filter((r) => r.type === 'modulo'))

  // Relay de modo manual
  const relayManual = computed(() => config.value?.relay_manual || '8')

  // Obtener relay por ID
  function getRelayById(id: string): RelayConfig | undefined {
    return config.value?.relays?.find((r) => r.id === id)
  }

  // Obtener nombre de relay por ID
  function getRelayName(id: string): string {
    const relay = getRelayById(id)
    return relay?.name || `Relay ${id}`
  }

  // Cargar configuración
  async function loadConfig() {
    if (loading.value) return
    loading.value = true
    try {
      const { data } = await api.get('/config')

      // Si no tiene relays, usar defaults
      if (!data.relays || data.relays.length === 0) {
        data.relays = defaultRelays
      }

      config.value = data
      loaded.value = true
    } catch (error) {
      console.error('Error cargando configuración:', error)
      // Usar defaults si falla
      config.value = {
        ipplaca: '',
        idplaca: 0,
        ipbroker: '',
        usermqtt: '',
        passmqtt: '',
        topic: '',
        relays: defaultRelays,
        relay_manual: '8',
      }
    } finally {
      loading.value = false
    }
  }

  return {
    config,
    loading,
    loaded,
    enabledRelays,
    generadores,
    racks,
    modulos,
    relayManual,
    getRelayById,
    getRelayName,
    loadConfig,
  }
})
