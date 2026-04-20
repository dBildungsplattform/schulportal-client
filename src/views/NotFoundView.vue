<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { useRouter, type Router } from 'vue-router';

  const router: Router = useRouter();

  function goBack(): void {
    router.push({ name: 'start' });
  }
</script>

<template>
  <SpshAlert
    :button-action="goBack"
    :button-text="$t('nav.backToStart')"
    :closable="false"
    :model-value="true"
    :show-button="true"
    :text="$t('errors.NOT_FOUND')"
    title="404"
    type="error"
  />
</template>

<style scoped></style>
