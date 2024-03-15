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
    class="service-provider-card mx-1 my-1 rounded-lg"
    :data-testid="testId || 'service-provider-card'"
    :href="href ? href : ''"
    :rel="newTab ? 'noreferrer' : ''"
    :target="newTab ? '_blank' : '_self'"
    :to="to"
  >
    <v-card-text class="d-flex justify-center mt-1">
      <v-row align="center">
        <v-col cols="2">
          <div>
            <v-avatar
              v-if="logoUrl"
              rounded="0"
              ><v-img
                alt="provider-logo"
                :src="logoUrl"
              ></v-img
            ></v-avatar>
            <!-- Fallback logo -->
            <v-avatar
              v-else
              rounded="0"
              ><v-img
                alt="schulportal-logo"
                :src="SchulPortalLogo"
              ></v-img
            ></v-avatar>
          </div>
        </v-col>
        <v-col
          cols="10"
          class="d-flex justify-center text-center"
        >
          <span data-testid="card-title">{{ title }}</span>
        </v-col>
      </v-row></v-card-text
    >
  </v-card>
</template>

<style></style>
