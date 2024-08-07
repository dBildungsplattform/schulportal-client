<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  function goBack(): void {
    window.history.back();
  }
</script>

<template>
  <SpshAlert
    :buttonAction="goBack"
    :buttonText="$t('nav.back')"
    :closable="false"
    :modelValue="true"
    :showButton="true"
    :text="$t('errors.NOT_FOUND')"
    title="404"
    type="error"
  />
</template>

<style scoped></style>
