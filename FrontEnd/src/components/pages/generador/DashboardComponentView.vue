<template>

</template>

<script setup lang="ts">
import { ref } from 'vue';

</script>

<style scoped lang="scss">
.dashboard {
    display: flex;
    height: 100%;
}

.sidebar {
    background-color: #f0f0f0;
    border-radius: 10px;
}

.main-content {
    flex: 1;
    padding: 20px;
    border-radius: 10px;
    background-color: hsl(240, 4%, 14%);
    border: 1px dashed #ccc;
}

.droppable-area {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    gap: 10px;
}

.draggable {
    cursor: move;
}
</style>