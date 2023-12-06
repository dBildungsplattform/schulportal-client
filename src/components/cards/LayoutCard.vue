<script setup lang="ts">
  defineProps<{
    header: string
  }>()
</script>

<template>
  <v-card class="layout-card">
    <h2 class="text-left card-headline">{{ header }}</h2>
    <v-divider class="border-opacity-100 rounded" thickness="5px" color="#1EAE9C"></v-divider>
    <slot />
  </v-card>
</template>

<style>

</style>