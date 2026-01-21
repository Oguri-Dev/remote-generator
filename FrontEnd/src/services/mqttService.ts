import { useMqttStore } from '/@src/stores/MqttStore'
import { useUserSession } from '/@src/stores/userSession'

// ✅ **Enviar acción a un relé específico (Encender, Apagar, Reiniciar)**
export const sendActionToBackend = async (relayId: string, status: string) => {
  const mqttStore = useMqttStore() // Usamos el store para acceder a la base URL
  const userSession = useUserSession()
  const BASE_URL = mqttStore.getBaseURL() // Asegurarnos de que la URL está actualizada
  const username = userSession.user?.username || 'system'
  try {
    const response = await fetch(`/mqtt/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relay_id: relayId, status, username }),
    })
    if (!response.ok) {
      throw new Error('Error al enviar comando MQTT')
    }
  } catch (error) {
    console.error('❌ Error al enviar la acción:', error)
  }
}

// ✅ **Obtener el estado actual de la secuencia desde el backend**
export const fetchSequenceState = async () => {
  const mqttStore = useMqttStore() // Usamos el store para acceder a la base URL
  const BASE_URL = mqttStore.getBaseURL() // Asegurarnos de que la URL está actualizada
  try {
    const response = await fetch(`/mqtt/sequence_state`)
    if (!response.ok) {
      throw new Error('Error al obtener el estado de secuencia')
    }
    const data = await response.json()
    return data.sequenceState
  } catch (error) {
    console.error('❌ Error obteniendo estado de secuencia:', error)
    return ''
  }
}
