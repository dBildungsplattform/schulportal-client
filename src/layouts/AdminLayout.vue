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

<style scoped lang="scss">
  @import '@/styles/variables';

  @media (min-width: 1280px) {
    .v-container {
      max-width: 1200px - $menuBarMinWidth;
    }
  }

  @media (min-width: 1600px) {
    .v-container {
      max-width: 1200px;
    }
  }
</style>
