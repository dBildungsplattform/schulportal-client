<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { ServiceIdentifierEnum } from '@/router/service-identifier.enum';
  import { RouteLocationNormalizedLoaded, Router, useRoute, useRouter } from 'vue-router';

  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const serviceName: ServiceIdentifierEnum = route.params['serviceName'] as ServiceIdentifierEnum;
  const messageObject: { title: string; text: string } = { title: '', text: '' };

  if (serviceName === ServiceIdentifierEnum.TWO_FACTOR_AUTHENTICATION) {
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
  <img
    style="margin: 0 auto; display: block"
    alt="Logo Schulportal"
    src="@/assets/logos/Schulportal_SH_Wort_Bildmarke_RGB_Anwendung_HG_Weiss.svg"
    width="354"
    height="60"
  />
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
