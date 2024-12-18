<script setup lang="ts">
  defineProps({
    enabledCondition: {
      type: Boolean,
    },
    disabledText: {
      type: String,
    },
    enabledText: {
      type: String,
    },
    position: {
      type: String as () => 'start' | 'end' | 'top' | 'bottom',
      default: 'top',
    },
  });
</script>

<template>
  <v-tooltip
    data-testid="tooltip"
    :attach="true"
    :location="position"
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
