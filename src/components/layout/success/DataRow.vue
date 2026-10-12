<script setup lang="ts">
  import { computed, type ComputedRef, type VNode } from 'vue';

  type Props = {
    label?: string;
    value?: string | number;
  };

  const props: Props = defineProps<Props>();
  const hasLabel: ComputedRef<boolean> = computed((): boolean => props.label !== undefined);
  const hasValue: ComputedRef<boolean> = computed((): boolean => props.value !== undefined);

  defineSlots<{
    label?(): VNode[];
    value?(): VNode[];
    default?(): VNode[];
  }>();
</script>

<template>
  <v-row>
    <v-col class="text-body bold text-right">
      <template v-if="hasLabel">{{ props.label }}</template>
      <slot
        v-else
        name="label"
      />:
    </v-col>
    <v-col class="text-body">
      <span>
        <template v-if="hasValue">{{ props.value }}</template>
        <slot
          v-else
          name="value"
        >
          <slot />
        </slot>
      </span>
    </v-col>
  </v-row>
</template>

<style scoped>
  .text-body {
    font-weight: normal;
  }
  .bold {
    font-weight: bold;
  }
</style>
