<script setup lang="ts">
import ConfigViewComponent from '/@src/components/pages/generador/ConfigComponentView.vue';
import { useViewWrapper } from '/@src/stores/viewWrapper';

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Configuracion')

useHead({
  title: 'Configuracion',
})
</script>

<template>
  <div class="page-content-inner" style="overflow-y: hidden; scrollbar-width: none;">
    <ConfigViewComponent />
  </div>
</template>

<style class="scss">
::-webkit-scrollbar {
  display: none;
}
</style>
