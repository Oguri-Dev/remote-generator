<script setup lang="ts">
import type { SidebarTheme } from '/@src/components/navigation/desktop/Sidebar.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'

const props = withDefaults(
  defineProps<{
    theme?: SidebarTheme
    defaultSidebar?: string
    closeOnChange?: boolean
    openOnMounted?: boolean
    nowrap?: boolean
  }>(),
  {
    defaultSidebar: 'dashboard',
    theme: 'default',
  }
)

const viewWrapper = useViewWrapper()
const route = useRoute()
const isMobileSidebarOpen = ref(false)
const isDesktopSidebarOpen = ref(props.openOnMounted)
const activeMobileSubsidebar = ref(props.defaultSidebar)


/**
 * watchPostEffect callback will be executed each time dependent reactive values has changed
 */
watchPostEffect(() => {
  viewWrapper.setPushed(isDesktopSidebarOpen.value ?? false)
})
watch(
  () => route.fullPath,
  () => {
    isMobileSidebarOpen.value = false

    if (props.closeOnChange && isDesktopSidebarOpen.value) {
      isDesktopSidebarOpen.value = false
    }
  }
)
</script>

<template>
  <div class="sidebar-layout">
    <div class="app-overlay" />
    <!-- Mobile navigation -->
    <MobileSidebar :is-open="isMobileSidebarOpen" @toggle="isMobileSidebarOpen = !isMobileSidebarOpen">
      <template #links>
        <li>
          <RouterLink to="/app">
            <i aria-hidden="true" class="iconify" data-icon="feather:home" />
          </RouterLink>
        </li>
        <!-- ✨ Nuevo: botón Configuración -->
        <li>
          <RouterLink to="/config">
            <i aria-hidden="true" class="iconify" data-icon="feather:settings" />
          </RouterLink>
        </li>
      </template>
    </MobileSidebar>

    <!-- Mobile subsidebar links -->
    <Transition name="slide-x">
      <DashboardsMobileSubsidebar v-if="isMobileSidebarOpen && activeMobileSubsidebar === 'dashboard'" />
    </Transition>

    <Sidebar :theme="props.theme">
      <template #links>
        <li>
          <RouterLink to="/app" data-content="Main view">
            <i aria-hidden="true" class="iconify sidebar-svg" data-icon="feather:home" />
          </RouterLink>
        </li>
        <!-- ✨ Nuevo: enlace directo a Configuración -->
        <li>
          <RouterLink to="/app/config" data-content="Configuración">
            <i aria-hidden="true" class="iconify sidebar-svg" data-icon="feather:settings" />
          </RouterLink>
        </li>
        <!-- ✨ Nuevo: enlace a Historial de Activaciones -->
        <li>
          <RouterLink to="/app/activity-logs" data-content="Historial">
            <i aria-hidden="true" class="iconify sidebar-svg" data-icon="feather:activity" />
          </RouterLink>
        </li>
      </template>
    </Sidebar>
    <VViewWrapper>
      <VPageContentWrapper>
        <template v-if="props.nowrap">
          <slot></slot>
        </template>
        <VPageContent v-else class="is-relative">
          <div class="page-title has-text-centered">
            <div class="title-wrap">
              <h1 class="title is-12">
                {{ viewWrapper.pageTitle }}
              </h1>
            </div>
            <Toolbar class="desktop-toolbar" />
          </div>
          <slot></slot>
        </VPageContent>
      </VPageContentWrapper>
    </VViewWrapper>
  </div>
</template>
