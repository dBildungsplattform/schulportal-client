<script setup lang="ts">
  import AdminMenuBar from '@/components/admin/MenuBar.vue'
  import TheFooter from '@/components/layout/TheFooter.vue'
</script>

<template>
  <AdminMenuBar></AdminMenuBar>
  <v-container>
    <slot />
  </v-container>
  <TheFooter></TheFooter>
</template>

<style></style>
