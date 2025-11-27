// src/services/apiUser.ts
import axios from 'axios'

export const api = axios.create({ baseURL: '/api', withCredentials: true })

// --- Auth (cookies) ---
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password }) // el server setea cookie

export const logout = () => {
  return api.post('/auth/logout')
}

export const getMe = () => api.get('/auth/me') // 200 -> { username }, 401 si no hay sesión

export const register = (username: string, password: string, role?: string) =>
  api.post('/auth/register', { username, password, role })
