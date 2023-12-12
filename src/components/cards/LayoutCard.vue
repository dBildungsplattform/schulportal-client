<script setup lang="ts">
  defineProps<{
    header: string
    padding?: string
  }>()
</script>

<template>
  <v-card class="layout-card">
    <h2 class="text-left layout-card-headline my-2">{{ header }}</h2>
    <v-divider
      class="border-opacity-100 rounded"
      color="#1EAE9C"
      thickness="5px"
    ></v-divider>
    <div :style="`padding: ${padding}`">
      <slot />
    </div>
  </v-card>
</template>

<style></style>
