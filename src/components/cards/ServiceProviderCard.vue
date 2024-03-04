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
    :data-testid="testId || 'service-provider-card'"
    :href="href ? href : ''"
    :rel="newTab ? 'noreferrer' : ''"
    :target="newTab ? '_blank' : '_self'"
    :title="title"
    :to="to"
    :variant="variant"
  >
    <template #prepend>
      <!-- If the logoUrl is defined-->
      <v-avatar
        v-if="logoUrl"
        alt="provider-logo"
        :image="logoUrl"
        size="small"
      ></v-avatar>
      <!-- Fallback logo -->
      <v-avatar
        v-else
        alt="schulportal-logo"
        :image="SchulPortalLogo"
        size="small"
      ></v-avatar>
    </template>
    <template #append>
      <v-icon
        @click.prevent
        icon="mdi-heart-outline"
        size="x-small"
      ></v-icon>
    </template>
  </v-card>
</template>

<style>
  .v-card .v-card-title {
    text-wrap: pretty;
    display: flex;
    justify-content: center; /* Center horizontally */
  }
</style>
