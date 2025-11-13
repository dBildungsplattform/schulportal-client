<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  function goBack(): void {
    window.history.back();
  }
</script>

<template>
  <SpshAlert
    :button-action="goBack"
    :button-text="$t('nav.back')"
    :closable="false"
    :model-value="true"
    :show-button="true"
    :text="$t('errors.NOT_FOUND')"
    title="404"
    type="error"
  />
</template>

<style scoped></style>
