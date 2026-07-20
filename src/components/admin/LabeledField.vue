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
  <v-row :class="[noMarginTop ? 'mt-2' : mdMarginTop ? 'mt-md-4' : 'mt-4']">
    <v-col
      cols="12"
      sm="auto"
      :class="{
        'd-flex pr-0 flex-shrink-1': true,
        'pt-0': !isLogo,
        'align-center': isLogo,
      }"
      style="max-width: fit-content"
    >
      <span class="subtitle-2 text-no-wrap">{{ label }}:</span>
    </v-col>
    <v-col
      :class="{
        'd-flex flex-grow-1 pl-2': true,
        'pt-0': !isLogo,
      }"
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
