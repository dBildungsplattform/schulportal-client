<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { useRouter, type Router } from 'vue-router';

  const route: Router = useRouter();

  function backToStart(): void {
    route.replace('/');
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
    :buttonAction="backToStart"
    :text="$t('errors.UNKNOWN_USER.text')"
  />
</template>

<style scoped></style>
