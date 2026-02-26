<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useDarkmode } from '/@src/stores/darkmode'
import { usePanels } from '/@src/stores/panels'
import { useRouter } from 'vue-router';
import { useUserSession } from '/@src/stores/userSession';
import { useConfigStore } from '/@src/stores/ConfigStore';
import { useNotyf } from '/@src/composable/useNotyf';
import axios from 'axios';

const router = useRouter();
const darkmode = useDarkmode()
const { locale } = useI18n()
const panels = usePanels()
const isOpen = ref(false);
const userSession = useUserSession();
const configStore = useConfigStore();
const notyf = useNotyf();
const api = axios.create({ baseURL: '/api', withCredentials: true });

const openModal = () => {
  isOpen.value = true;
};

const closeModal = () => {
  isOpen.value = false;
};

const logout = async () => {
  await userSession.logoutUser()
  router.push('/auth/login')
};

// Estado del broker mode
const isSwitchingMode = ref(false);
const brokerMode = computed(() => configStore.config?.broker_mode || 'cloud');

// Cambiar entre modo nube y local
const toggleBrokerMode = async () => {
  const newMode = brokerMode.value === 'cloud' ? 'local' : 'cloud';
  const modeName = newMode === 'cloud' ? '☁️ Nube' : '🏠 Local';
  
  isSwitchingMode.value = true;
  try {
    notyf.info(`Cambiando a modo ${modeName}... Reconfigurando placa...`);
    
    await api.post('/config/broker-mode', { mode: newMode });
    await configStore.loadConfig(); // Recargar configuración
    
    notyf.success(`✅ Modo cambiado a: ${modeName}\n⏳ La placa se está reconfigurando automáticamente...`);
    
    // Mensaje adicional sobre el backend
    setTimeout(() => {
      notyf.info('💡 El backend se reconectará automáticamente al nuevo broker');
    }, 1500);
  } catch (error) {
    console.error('Error cambiando modo broker:', error);
    notyf.error('❌ Error al cambiar modo de conexión');
  } finally {
    isSwitchingMode.value = false;
  }
};


const localFlagSrc = computed(() => {
  switch (locale.value) {
    case 'fr':
      return '/images/icons/flags/france.svg'
    case 'es':
      return '/images/icons/flags/spain.svg'
    case 'es-MX':
      return '/images/icons/flags/mexico.svg'
    case 'de':
      return '/images/icons/flags/germany.svg'
    case 'zh-CN':
      return '/images/icons/flags/china.svg'
    case 'ar':
      return '/images/icons/flags/saudi-arabia.svg'
    case 'en':
    default:
      return '/images/icons/flags/united-states-of-america.svg'
  }
})
</script>

<template>
  <div class="toolbar">
    <!-- <div class="toolbar-icon " @click="openModal">
      <i class="iconify " data-icon="feather:settings" aria-hidden="true" style="height: 20px; width: 20px;"> </i>
    </div> -->

    <!-- Botón de cambio de modo broker -->
    <div class="toolbar-icon broker-toggle" 
         @click="toggleBrokerMode" 
         :class="{ 'is-loading': isSwitchingMode }"
         :title="`Modo actual: ${brokerMode === 'cloud' ? 'Nube' : 'Local'}`">
      <i v-if="!isSwitchingMode" 
         :class="brokerMode === 'cloud' ? 'fas fa-cloud' : 'fas fa-home'" 
         style="font-size: 18px;" 
         :style="{ color: brokerMode === 'cloud' ? '#00D1B2' : '#FF7043' }">
      </i>
      <i v-else class="fas fa-spinner fa-spin" style="font-size: 18px; color: var(--primary);"></i>
    </div>

    <div class="toolbar-link">
      <label tabindex="0" class="dark-mode" role="button"
        @keydown.space.prevent="(e) => (e.target as HTMLLabelElement).click()">
        <input data-cy="dark-mode-toggle" type="checkbox" :checked="!darkmode.isDark" @change="darkmode.onChange">
        <span />
      </label>
    </div>

    <button @click="logout()" style="background-color: transparent; border-color: transparent; cursor: pointer;">
      <i aria-hidden="true" class="fas fa-sign-out-alt fa-2x" style="color: var(--primary);;" /></button>

    <slot />
  </div>
</template>

<style scoped lang="scss">
.toolbar-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 34px;
  width: 34px;
  border-radius: var(--radius-rounded);
  margin: 0 4px;
  transition: all 0.3s;
  cursor: pointer;
}

.toolbar-icon:hover {
  background: rgb(34, 34, 37);
  border-color: rgb(34, 34, 37);
  box-shadow: rgb(34, 34, 37);
  color: var(--primary);
}

.broker-toggle {
  position: relative;
}

.broker-toggle.is-loading {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
