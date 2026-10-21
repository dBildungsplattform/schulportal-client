<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { ServiceIdentifier } from '@/router/service-identifier.enum';
  import { RouteLocationNormalizedLoaded, Router, useRoute, useRouter } from 'vue-router';

  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const serviceName: ServiceIdentifier = route.params['serviceName'] as ServiceIdentifier;
  const messageObject: { title: string; text: string } = { title: '', text: '' };

  if (serviceName === ServiceIdentifier.TWO_FACTOR_AUTHENTICATION) {
    messageObject.title = 'admin.person.twoFactorAuthentication.header';
    messageObject.text = 'admin.person.twoFactorAuthentication.errors.connectionFailure';
  } else {
    router.push('/not-found');
  }

  function goToStart(): void {
    window.location.href = '/start';
  }
</script>

<template>
  <SpshAlert
    :button-action="goToStart"
    :button-text="$t('nav.backToStart')"
    :closable="false"
    :model-value="true"
    :show-button="true"
    :text="$t(messageObject.text)"
    :title="$t(messageObject.title)"
    type="error"
  >
  </SpshAlert>
</template>

<style scoped></style>
