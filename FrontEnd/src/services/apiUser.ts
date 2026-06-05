// src/services/apiUser.ts
import axios from 'axios'

export const api = axios.create({ baseURL: '/api', withCredentials: true })

// Interceptor global: si el backend responde 401 (sesión ausente/expirada),
// redirige al login conservando la ruta de destino. Se ignora en las propias
// rutas de auth para no entrar en bucle (un login fallido es 401 esperado).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    const onAuthRoute = url.includes('/auth/')
    if (status === 401 && !onAuthRoute && typeof window !== 'undefined') {
      const current = window.location.pathname + window.location.search
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.assign(`/auth/login?redirect=${encodeURIComponent(current)}`)
      }
    }
    return Promise.reject(error)
  }
)

// --- Auth (cookies) ---
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password }) // el server setea cookie

export const logout = () => {
  return api.post('/auth/logout')
}

export const getMe = () => api.get('/auth/me') // 200 -> { username }, 401 si no hay sesión

export const register = (username: string, password: string, role?: string) =>
  api.post('/auth/register', { username, password, role })
