<script setup lang="ts">
  import { computed, type ComputedRef } from 'vue';

  type Props = {
    disabledText?: string;
    enabledCondition?: boolean;
    enabledText?: string;
    position?: 'start' | 'end' | 'top' | 'bottom';
  };

  const props: Props = withDefaults(defineProps<Props>(), {
    position: 'top',
  });

  const tooltipText: ComputedRef<string | undefined> = computed(() => {
    return props.enabledCondition ? props.enabledText : props.disabledText;
  });
</script>

<template>
  <v-tooltip
    data-testid="tooltip"
    :location="position"
    :disabled="!tooltipText"
    open-delay="500"
  >
    <template v-slot:activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps">
        <slot />
      </div>
    </template>
    <span
      v-if="tooltipText"
      data-testid="tooltip-text"
    >
      {{ tooltipText }}
    </span>
  </v-tooltip>
</template>
