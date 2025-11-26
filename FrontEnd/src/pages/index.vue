<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onBeforeMount, nextTick } from 'vue';

useHead({
  title: 'Vuero - A complete Vue 3 design system',
})

const router = useRouter();

onBeforeMount(() => {
  nextTick(() => {
    router.push('/auth/login');
  });
})
</script>

<template>
  <LandingLayout theme="darker">
  </LandingLayout>
</template>

<style lang="scss"></style>