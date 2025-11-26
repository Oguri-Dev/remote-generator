<script setup lang="ts">
import PrincipalViewComponent from '/@src/components/pages/generador/PrincipalViewComponent.vue';
import { useViewWrapper } from '/@src/stores/viewWrapper';

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Control Generador')

useHead({
  title: 'Control Generador',
})
</script>

<template>
  <div class="page-content-inner" style="overflow-y: hidden; scrollbar-width: none;">
    <PrincipalViewComponent />
  </div>
</template>

<style class="scss">
::-webkit-scrollbar {
  display: none;
}
</style>
