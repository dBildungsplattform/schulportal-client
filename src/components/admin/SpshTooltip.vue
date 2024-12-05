<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue';

  // Props definition
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

  // Reactive state for tooltip visibility
  const tooltipVisible: Ref<boolean> = ref(false);

  // Determine if the user is on a mobile device
  const isMobile: Ref<boolean> = ref(false);

  onMounted(() => {
    isMobile.value = /Mobi|Android/i.test(navigator.userAgent);
  });

  // Close tooltip on external touch
  const closeTooltip = (event: Event): void => {
    if (!(event.target as Element).closest('[data-testid="tooltip"]')) {
      tooltipVisible.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener('touchstart', closeTooltip);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('touchstart', closeTooltip);
  });
</script>

<template>
  <v-tooltip
    v-model="tooltipVisible"
    data-testid="tooltip"
    :location="position"
    open-delay="500"
    :open-on-hover="!isMobile"
    :open-on-click="isMobile"
  >
    <template v-slot:activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps">
        <slot />
      </div>
    </template>
    <span data-testid="tooltip-text">{{ enabledCondition ? enabledText : disabledText }}</span>
  </v-tooltip>
</template>
