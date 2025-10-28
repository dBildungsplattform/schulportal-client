<script setup lang="ts">
  defineProps<{
    label: string;
    value?: string | number | boolean;
    testId?: string;
    noMarginTop?: boolean;
    isLogo?: boolean;
    logoSrc?: string;
    defaultLogoSrc?: string;
    mdMarginTop?: boolean;
    wordBreakAll?: boolean;
  }>();
</script>

<template>
  <v-row :class="[noMarginTop ? 'align-center' : mdMarginTop ? 'mt-md-4 align-center' : 'mt-4 align-center']">
    <v-col
      cols="auto"
      class="d-flex align-center pr-2"
    >
      <span class="subtitle-2">{{ label }}:</span>
    </v-col>
    <v-col
      :cols="isLogo ? undefined : 'auto'"
      class="d-flex align-center"
      :data-testid="testId"
      :style="wordBreakAll ? 'word-break: break-all' : undefined"
    >
      <!-- Logo display -->
      <template v-if="isLogo">
        <v-img
          v-if="logoSrc"
          alt="provider-logo"
          class="service-provider-logo"
          :src="logoSrc"
          max-width="40"
        />
        <v-img
          v-else
          alt="schulportal-logo"
          class="service-provider-logo"
          :src="defaultLogoSrc"
          contain
          max-width="40"
        />
      </template>

      <!-- Regular text display -->
      <span
        v-else
        class="text-body text-break"
      >
        {{ value }}
      </span>
    </v-col>
  </v-row>
</template>
