<!-- SuccessTemplate.vue -->
<script setup lang="ts">
  import { defineProps } from 'vue';
  import { useRouter, type Router } from 'vue-router';
  import type { ComputedRef, Ref } from 'vue';
  import type { RolleStore } from '@/stores/RolleStore';
  import { useDisplay } from 'vuetify';
  import { type Composer, useI18n } from 'vue-i18n';

  defineProps<{
    rolleStore: RolleStore;
    translatedUpdatedRolleMerkmale: ComputedRef<string>;
    translatedUpdatedAngebote: ComputedRef<string>;
    translatedUpdatedSystemrecht: ComputedRef<string>;
  }>();

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();

  const backToDetails = (): void => {
    router.go(0);
  };
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col
        class="subtitle-1"
        cols="auto"
      >
        <span data-testid="rolle-success-text">{{ t('admin.rolle.rolleUpdatedSuccessfully') }}</span>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="auto">
        <v-icon
          small
          color="#1EAE9C"
          icon="mdi-check-circle"
        ></v-icon>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col
        class="subtitle-2"
        cols="auto"
      >
        {{ t('admin.followingDataCreated') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col class="text-body bold text-right">{{ t('admin.rolle.rollenname') }}:</v-col>
      <v-col class="text-body">
        <span data-testid="updated-rolle-name">{{ rolleStore.updatedRolle?.name }}</span>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="text-body bold text-right">{{ t('admin.rolle.merkmale') }}:</v-col>
      <v-col class="text-body">
        <span data-testid="updated-rolle-merkmale">{{ translatedUpdatedRolleMerkmale }}</span>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="text-body bold text-right">{{ t('admin.serviceProvider.assignedServiceProvider') }}:</v-col>
      <v-col class="text-body">
        <span data-testid="updated-rolle-angebote">{{ translatedUpdatedAngebote }}</span>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="text-body bold text-right">{{ t('admin.rolle.systemrechte') }}:</v-col>
      <v-col class="text-body">
        <span data-testid="updated-rolle-systemrecht">{{ translatedUpdatedSystemrecht }}</span>
      </v-col>
    </v-row>
    <v-divider
      class="border-opacity-100 rounded my-6"
      color="#E5EAEF"
      thickness="6"
    ></v-divider>
    <v-row justify="end">
      <v-col
        cols="12"
        sm="6"
        md="auto"
      >
        <v-btn
          class="secondary"
          data-testid="back-to-details-button"
          :block="mdAndDown"
          @click="backToDetails"
        >
          {{ t('nav.backToDetails') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .text-body {
    font-weight: normal;
  }
  .bold {
    font-weight: bold;
  }
</style>
