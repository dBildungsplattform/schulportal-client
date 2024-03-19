<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  function goBack(): void {
    window.history.back();
  }
</script>

<template>
  <SpshAlert
    :modelValue="true"
    :title="404"
    :type="'error'"
    :closable="false"
    :showButton="true"
    :buttonText="$t('nav.back')"
    :buttonAction="goBack"
    :text="$t('errors.NOT_FOUND')"
  />
</template>

<style scoped></style>
