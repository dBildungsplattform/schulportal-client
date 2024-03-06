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
    :title="title"
    :to="to"
  >
    <template #prepend>
      <!-- If the logoUrl is defined-->
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
    </template>
  </v-card>
</template>

<style></style>
