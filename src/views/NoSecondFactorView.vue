<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';

  function goToStart(): void {
    window.location.href = '/start';
  }
  function toSecondFactorSetup(): void {
    window.location.href = '/profile';
  }
</script>

<template>
  <SpshAlert
    :button-action="goToStart"
    :button-text="$t('nav.backToStart')"
    :closable="false"
    :model-value="true"
    :show-button="true"
    :text="$t('admin.person.twoFactorAuthentication.requiredSecondFactor')"
    :title="$t('admin.person.twoFactorAuthentication.header')"
    type="error"
  >
    <template #button>
      <v-col cols="auto">
        <v-btn
          class="primary"
          data-testid="toSecondFactorSetup-button"
          @click="toSecondFactorSetup"
        >
          {{ $t('admin.person.twoFactorAuthentication.toSecondFactorSetup') }}
        </v-btn>
      </v-col>
    </template>
    <template #text>
      <p>
        {{ $t('admin.person.twoFactorAuthentication.noSecondFactorText') }}
      </p>
      <p class="mt-8">
        {{ $t('admin.person.twoFactorAuthentication.setUpInfo') }}
      </p>
    </template>
  </SpshAlert>
</template>

<style scoped></style>
