<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';

  function logout(): void {
    const url: URL = new URL(window.origin + '/api/auth/logout');
    window.location.href = url.toString();
  }
</script>

<template>
  <SpshAlert
    :modelValue="true"
    :title="$t('errors.UNKNOWN_USER.title')"
    :type="'warning'"
    :closable="false"
    :showButton="true"
    :buttonText="$t('nav.backToStart')"
    :buttonAction="logout"
    :text="$t('errors.UNKNOWN_USER.text')"
  />
</template>

<style scoped></style>
