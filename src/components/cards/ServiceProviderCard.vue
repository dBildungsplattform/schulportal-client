<script setup lang="ts">
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg';

  defineProps<{
    href?: string;
    newTab?: boolean;
    testId: string;
    title: string;
    logoUrl?: string;
    to?: string;
    variant?: NonNullable<'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'>;
  }>();
</script>

<template>
  <v-card
    class="service-provider-card mx-1 my-1 rounded-lg d-flex"
    :data-testid="testId || 'service-provider-card'"
    :href="href ? href : ''"
    :rel="newTab ? 'noreferrer' : ''"
    :target="newTab ? '_blank' : '_self'"
    :to="to"
  >
    <v-card-text class="d-flex justify-center">
      <v-row>
        <v-col
          cols="2"
          class="pt-0 pb-0 d-flex justify-center align-center"
        >
          <v-avatar
            v-if="logoUrl"
            rounded="0"
          >
            <v-img
              alt="provider-logo"
              class="service-provider-logo"
              :src="logoUrl"
            />
          </v-avatar>
          <!-- Fallback logo -->
          <v-avatar
            v-else
            rounded="0"
          >
            <v-img
              alt="schulportal-logo"
              class="service-provider-logo"
              :src="SchulPortalLogo"
            />
          </v-avatar>
        </v-col>
        <v-col
          cols="10"
          class="pt-0 pb-0 d-flex justify-center align-center"
        >
          <span
            class="overflow-wrap text-center"
            data-testid="card-title"
            >{{ title }}
          </span>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style></style>
