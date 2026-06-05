import { api } from '/@src/services/apiUser'

// Envía una acción a un relé (Encender, Apagar, Reiniciar).
// El backend identifica al usuario por la cookie de sesión firmada, por lo que
// NO se envía username en el body y las peticiones van con credenciales.
export const sendActionToBackend = async (relayId: string, status: string) => {
  const { data } = await api.post('/mqtt/action', {
    relay_id: relayId,
    status,
  })
  return data
}

// Obtiene el estado actual de la secuencia desde el backend.
export const fetchSequenceState = async () => {
  const { data } = await api.get('/mqtt/sequence_state')
  return data.sequenceState
}
