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
    :buttonAction="goToStart"
    :buttonText="$t('nav.backToStart')"
    :closable="false"
    :modelValue="true"
    :showButton="true"
    :text="$t('admin.person.twoFactorAuthentication.requiredSecondFactor')"
    :title="$t('admin.person.twoFactorAuthentication.header')"
    type="error"
  >
    <template v-slot:button>
      <v-col cols="auto">
        <v-btn
          class="primary"
          @click="toSecondFactorSetup"
          data-testid="toSecondFactorSetup-button"
        >
          {{ $t('admin.person.twoFactorAuthentication.toSecondFactorSetup') }}
        </v-btn>
      </v-col>
    </template>
    <template v-slot:text>
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
