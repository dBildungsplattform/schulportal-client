<script setup lang="ts">
  type Props = {
    errorLabel?: string | boolean;
    label?: string;
    isRequired?: boolean;
    labelForId: string;
    noTopMargin?: boolean;
    isAlignedWithRadio?: boolean;
  };

  defineProps<Props>();
</script>

<template>
  <v-row :class="`${noTopMargin ? 'align-center' : 'align-center mt-8'}`">
    <v-col
      :class="`${isAlignedWithRadio ? 'pb-sm-8 pt-sm-3 text-sm-right mb-sm-10' : 'pb-sm-8 pt-sm-3 text-sm-right'}`"
      cols="12"
      sm="5"
    >
      <label
        :for="labelForId"
        :error="errorLabel"
        :required="isRequired"
        >{{ label }}</label
      >
    </v-col>
    <v-col
      class="py-0"
      cols="12"
      sm="7"
    >
      <slot />
    </v-col>
  </v-row>
</template>

<style></style>
