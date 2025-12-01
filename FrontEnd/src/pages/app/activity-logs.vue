<script setup lang="ts">
import ActivityLogsView from '/@src/components/pages/generador/ActivityLogsView.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Historial de Activaciones')

useHead({
  title: 'Historial de Activaciones',
})
</script>

<template>
  <div class="page-content-inner">
    <ActivityLogsView />
  </div>
</template>
