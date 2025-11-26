<script setup lang="ts">
import { useDarkmode } from '/@src/stores/darkmode'
import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const isLoading = ref(false)
const darkmode = useDarkmode()
const router = useRouter()
const route = useRoute()
const notyf = useNotyf()
const userSession = useUserSession()
const redirect = route.query.redirect as string
const isFullScreen = ref(false)

const username = ref('')
const password = ref('')

const handleLogin = async () => {
  if (!isLoading.value) {
    isLoading.value = true
    try {
      await userSession.login(username.value, password.value)
      notyf.dismissAll()
      notyf.success('Bienvenido !!!')
      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/app')
      }
    } catch (error) {
      notyf.error('Error en el inicio de sesión')
    } finally {
      isLoading.value = false
    }
  }
}

useHead({
  title: 'Ingresar',
})

const requestFullScreen = () => {
  const element = document.documentElement

  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
  isFullScreen.value = true
}

const exitFullScreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
  isFullScreen.value = false
}

const toggleFullScreen = () => {
  if (isFullScreen.value) {
    exitFullScreen()
  } else {
    requestFullScreen()
  }
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    exitFullScreen()
  } else if (event.key === 'F11') {
    event.preventDefault() // Evitar que el navegador procese el evento F11

    if (isFullScreen.value) {
      exitFullScreen()
    } else {
      requestFullScreen()
    }
  }
}

const handleFullscreenChange = () => {
  isFullScreen.value = !!(
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  )
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})
definePage({
  meta: { public: true }   // esta ruta no requiere autenticación
})
</script>

<template>
  <div class="auth-wrapper-inner columns is-gapless">
    <!-- Image section (hidden on mobile) -->
    <div class="column login-column is-9 h-hidden-mobile h-hidden-tablet-p hero-banner">
      <div class="hero login-hero is-fullheight is-app-grey">
        <div class="hero-body" style="position: relative; overflow: hidden;">
          <iframe src="https://www.omnifish.cl/" frameborder="0" width="100%" height="100%"
            style="overflow-y: hidden;position: absolute;" />
        </div>
        <div class="hero-footer">
          <p class="has-text-centered" />
        </div>
      </div>
    </div>

    <!-- Form section -->
    <div class="column is-3">
      <div class="hero is-fullheight is-white">
        <div class="hero-heading">
          <button @click="toggleFullScreen()"
            style="background-color: transparent; border-color: transparent; cursor: pointer; position: absolute; right: 20%; top: 26px; z-index: 999;">
            <i aria-hidden="true" class="fas fa-expand fa-2x" style="color: var(--primary);" />
          </button>
          <label class="dark-mode ml-auto" tabindex="0" role="button"
            @keydown.space.prevent="(e) => (e.target as HTMLLabelElement).click()">
            <input type="checkbox" :checked="!darkmode.isDark" @change="darkmode.onChange">
            <span />
          </label>
        </div>
        <div class="hero-body" style="position: relative;">
          <div style="position: absolute; top: 15%; right: 50%; transform: translateX(50%);">
            <RouterLink to="/">
              <img src="/omni-logo-2-dark.png" style="width: 300px;" />
              <!-- <AnimatedLogo width="36px" height="36px" /> -->
            </RouterLink>
          </div>
          <div class="container">
            <div class="columns">
              <div class="column is-12">
                <div class="auth-content">
                  <h2>Bienvenido de nuevo.</h2>
                  <p>Por favor inicia sesión en tu cuenta</p>
                  <RouterLink to="/auth/signup-2">
                    Todavía no tengo una cuenta
                  </RouterLink>
                </div>
                <div class="auth-form-wrapper">
                  <!-- Login Form -->
                  <form method="post" novalidate @submit.prevent="handleLogin">
                    <div class="login-form">
                      <!-- Username -->
                      <VField>
                        <VControl icon="feather:user">
                          <VInput v-model="username" type="text" placeholder="Usuario" autocomplete="username" />
                        </VControl>
                      </VField>

                      <!-- Password -->
                      <VField>
                        <VControl icon="feather:lock">
                          <VInput v-model="password" type="password" placeholder="Contraseña"
                            autocomplete="current-password" />
                        </VControl>
                      </VField>

                      <!-- Switch -->
                      <VField>
                        <VControl class="setting-item">
                          <VCheckbox label="Recuérdame" paddingless />
                        </VControl>
                      </VField>

                      <!-- Submit -->
                      <div class="login">
                        <VButton :loading="isLoading" color="primary" type="submit" bold fullwidth raised>
                          Iniciar sesión
                        </VButton>
                      </div>

                      <div class="forgot-link has-text-centered">
                        <a>¿Has olvidado tu contraseña?</a>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
