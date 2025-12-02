import {
  createRouter as createClientRouter,
  createWebHistory,
  createMemoryHistory,
  setupDataFetchingGuard,
} from 'vue-router/auto'

import { useUserSession } from '/@src/stores/userSession' // ⬅️

export function createRouter() {
  const router = createClientRouter({
    // Si sirves bajo subdirectorio, ya lo tienes configurado:
    history: import.meta.env.SSR
      ? createMemoryHistory()
      : createWebHistory('proyecto-generador'),

    scrollBehavior: (to, from, savedPosition) => {
      if (to.hash) {
        if (to.hash === '#') {
          return { top: 0, behavior: 'smooth' }
        }
        const el = document.querySelector(to.hash)
        if (el) {
          const top = parseFloat(getComputedStyle(el).scrollMarginTop)
          if (el instanceof HTMLElement) el.focus()
          return { el: to.hash, behavior: 'smooth', top }
        }
        return { el: to.hash, behavior: 'smooth' }
      }
      if (savedPosition) return savedPosition
      else if (to.path !== from.path) return { top: 0 }
    },
  })

  // Experimental data fetching guard (como ya lo tenías)
  setupDataFetchingGuard(router)

  // 🔒 Guard global de autenticación (cookies + /auth/me)
  router.beforeEach(async (to) => {
    const session = useUserSession()
    const isPublic = to.path.startsWith('/auth') // solo /auth es pública

    // Si ya está logueado, permitir acceso
    if (session.isLoggedIn) {
      // Si intenta ir al login estando logueado, redirigir a /app
      if (isPublic) {
        return { path: '/app' }
      }
      return // permitir navegación
    }

    // Si no está logueado y no está verificando, verificar sesión
    if (!session.checking) {
      await session.checkSession() // espera respuesta de /auth/me
    }

    // Después de verificar, si está logueado permitir
    if (session.isLoggedIn) {
      if (isPublic) {
        return { path: '/app' }
      }
      return
    }

    // No está logueado y quiere ir a ruta protegida
    if (!isPublic) {
      return { path: '/auth/login', query: { redirect: to.fullPath } }
    }
  })

  return router
}
