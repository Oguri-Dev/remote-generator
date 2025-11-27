import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getMe,
} from '/@src/services/apiUser'

type User = { username: string } | null

export const useUserSession = defineStore('userSession', () => {
  const user = ref<User>(null)
  const loading = ref(false)
  const checking = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function login(username: string, password: string) {
    loading.value = true
    try {
      await apiLogin(username, password) // setea cookie en el navegador
      const { data } = await getMe() // rehidrata usuario
      user.value = data
    } finally {
      loading.value = false
    }
  }

  async function checkSession() {
    checking.value = true
    try {
      const { data } = await getMe()
      user.value = data
    } catch {
      user.value = null
    } finally {
      checking.value = false
    }
  }

  async function createUser(username: string, password: string, role?: string) {
    loading.value = true
    try {
      await apiRegister(username, password, role)
    } finally {
      loading.value = false
    }
  }

  async function logoutUser() {
    await apiLogout()
    user.value = null
  }

  return {
    user,
    loading,
    checking,
    isLoggedIn,
    login,
    checkSession,
    createUser,
    logoutUser,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserSession, import.meta.hot))
}
