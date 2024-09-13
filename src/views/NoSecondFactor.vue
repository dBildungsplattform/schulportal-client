<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  function goBack(): void {
    window.history.back();
  }

  function toSecondFactorSetup(): void {
    window.location.href = '/profile';
  }
</script>

<template>
  <SpshAlert
    :buttonAction="goBack"
    :buttonText="$t('nav.back')"
    :closable="false"
    :modelValue="true"
    :showButton="true"
    :text="$t('admin.person.twoFactorAuthentication.noSecondFactorText')"
    :title="$t('admin.person.twoFactorAuthentication.header')"
    type="error"
  >
    <v-col cols="auto">
      <v-btn
        class="primary"
        @click="toSecondFactorSetup"
        data-testid="alert-button"
      >
        {{ $t('admin.person.twoFactorAuthentication.toSecondFactorSetup') }}
      </v-btn>
    </v-col>
  </SpshAlert>
</template>

<style scoped></style>
