<script setup lang="ts">
  type Props = {
    enabledCondition: boolean;
    disabledText: string;
    enabledText: string;
  };

  defineProps<Props>();
</script>

<template>
  <v-tooltip
    data-testid="tooltip"
    location="top"
    open-delay="500"
  >
    <template v-slot:activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps">
        <slot />
      </div>
    </template>
    <span data-testid="tooltip-text">{{ enabledCondition ? enabledText : disabledText }}</span>
  </v-tooltip>
</template>

<style></style>
