<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useDarkmode } from '/@src/stores/darkmode'
import { usePanels } from '/@src/stores/panels'
import { useRouter } from 'vue-router';
import { useUserSession } from '/@src/stores/userSession';

const router = useRouter();
const darkmode = useDarkmode()
const { locale } = useI18n()
const panels = usePanels()
const isOpen = ref(false);
const userSession = useUserSession();
const openModal = () => {
  isOpen.value = true;
  console.log(isOpen.value)
};

const closeModal = () => {
  isOpen.value = false;
};

const logout = () => {
  console.log("calling logout navbar")
  userSession.logoutUser()
  router.push('/auth/login');
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
</style>
