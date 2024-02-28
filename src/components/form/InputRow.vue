<script setup lang="ts">
  type Props = {
    errorLabel: string | boolean
    labelForId: string
    isRequired?: boolean
    label: string
  }

  defineProps<Props>()
</script>

<template>
  <v-row class="align-center mt-8">
    <v-col
      class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
      cols="12"
      sm="4"
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
      sm="8"
    >
      <slot />
    </v-col>
  </v-row>
</template>

<style></style>
