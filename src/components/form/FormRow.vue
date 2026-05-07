<script setup lang="ts">
  type Props = {
    errorLabel?: string | boolean;
    label?: string;
    isRequired?: boolean;
    labelForId: string;
    noTopMargin?: boolean;
    isAlignedWithRadio?: boolean;

    /**
     * Makes the content column stretch wider and start further left.
     * Useful for components like logo grids.
     */
    wideContent?: boolean;
  };

  withDefaults(defineProps<Props>(), {
    wideContent: false,
  });
</script>

<template>
  <v-row :class="`${noTopMargin ? 'align-start' : 'align-start mt-8'}`">
    <!-- Label column -->
    <v-col
      :class="`${isAlignedWithRadio ? 'pb-sm-8 pt-sm-3 text-sm-right mb-sm-10' : 'pb-sm-8 pt-sm-3 text-sm-right'}`"
      cols="12"
      :sm="wideContent ? '3' : '5'"
    >
      <label
        :for="labelForId"
        :error="errorLabel"
        :required="isRequired"
      >
        {{ label }}
      </label>
    </v-col>

    <!-- Content column -->
    <v-col
      class="py-0"
      cols="12"
      :sm="wideContent ? '9' : '7'"
    >
      <slot />
    </v-col>
  </v-row>
</template>

<style scoped></style>
