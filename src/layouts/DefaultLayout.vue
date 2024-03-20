<script setup lang="ts">
  import TheFooter from '@/components/layout/TheFooter.vue';
</script>

<template>
  <v-container>
    <slot />
  </v-container>
  <TheFooter></TheFooter>
</template>

<style scoped lang="scss">

  @media (min-width: 1280px) {
    .v-container {
      margin-bottom: 240px;
    }
  }

  @media (min-width: 1600px) {
    .v-container {
      max-width: 1200px;
    }
  }
</style>

