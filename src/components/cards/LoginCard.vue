<script setup lang="ts">
  import { parseISO, isWithinInterval } from 'date-fns';
  import { computed, type ComputedRef } from 'vue';
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';

  const route: RouteLocationNormalizedLoaded = useRoute();

  // Define the maintenance date range
  const isMaintenancePeriod: ComputedRef<boolean> = computed(() => {
    const today: Date = new Date();
    const startDate: Date = parseISO('2024-12-07T00:00:00');
    const endDate: Date = parseISO('2024-12-08T00:00:00');

    // Check if today falls within the maintenance period
    return isWithinInterval(today, { start: startDate, end: endDate });
  });
</script>

<template>
  <v-card
    class="login-card"
    data-testid="login-card"
    flat
  >
    <!-- Main title -->
    <v-row
      class="mb-5"
      justify="center"
      no-gutters
    >
      <v-col class="text-center">
        <img
          aria-hidden="true"
          alt="Logo Schulportal"
          class="logo"
          src="@/assets/logos/erwin_logos/Logo-ErWIn-Portal-dunkel.svg"
          width="540"
        />
      </v-col>
    </v-row>

    <v-row
      class="mb-7"
      justify="center"
      no-gutters
    >
      <v-col class="text-center">
        <!-- Subtitle/welcome message -->
        <h1
          class="headline-2"
          data-testid="landing-headline"
        >
          {{ $t('landingTitle') }}
        </h1>
      </v-col>
    </v-row>
    <!-- Maintenance notice -->
    <div
      v-if="isMaintenancePeriod"
      class="red-border"
    >
      <v-row
        class="mb-7"
        justify="center"
        no-gutters
      >
        <v-col class="text-center">
          <h1
            class="headline-2 text-red"
            data-testid="landing-maintenance-title"
          >
            {{ $t('login.maintenanceNoticeTitle') }}
          </h1>
        </v-col>
      </v-row>

      <v-row
        class="mb-7"
        justify="center"
        no-gutters
      >
        <v-col class="text-center">
          <h1
            class="text-body"
            data-testid="landing-maintenance-text"
          >
            {{ $t('login.maintenanceNoticeText') }}
          </h1>
        </v-col>
      </v-row>

      <v-row
        class="mb-7"
        justify="center"
        no-gutters
      >
        <v-col class="text-center">
          <h1 class="subtitle-2">
            {{ $t('login.doNotLogin') }}
          </h1>
        </v-col>
      </v-row>
    </div>
    <!-- Login Button -->
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
        sm="6"
        class="d-flex justify-center"
      >
        <v-btn
          data-testid="login-button"
          class="primary"
          :href="`/api/auth/login?redirectUrl=${route.fullPath}`"
        >
          {{ $t('login.button') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
  .login-card {
    padding: 6.25rem 0;
  }

  @media (max-width: 680px) {
    .logo {
      width: 100%;
      max-width: 380px;
    }
  }

  .red-border {
    border: 2px solid red;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 20px;
  }
</style>
