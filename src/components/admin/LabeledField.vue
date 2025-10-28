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
  <v-row :class="[noMarginTop ? 'align-center mt-2' : mdMarginTop ? 'mt-md-4 align-center' : 'mt-4 align-center']">
    <v-col
      cols="12"
      sm="auto"
      class="d-flex align-center pr-0 flex-shrink-1"
      style="max-width: fit-content;"
    >
      <span class="subtitle-2 text-no-wrap">{{ label }}:</span>
    </v-col>
    <v-col
      class="d-flex align-center flex-grow-1"
      :data-testid="testId"
      :style="wordBreakAll ? 'word-break: break-all' : undefined"
    >
      <!-- Logo display -->
      <template v-if="isLogo">
        <v-img
          v-if="logoSrc"
          alt="provider-logo"
          class="service-provider-logo mt-n2"
          :src="logoSrc"
          max-width="30"
        />
        <v-img
          v-else
          alt="schulportal-logo"
          class="service-provider-logo"
          :src="defaultLogoSrc"
          contain
          max-width="30"
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