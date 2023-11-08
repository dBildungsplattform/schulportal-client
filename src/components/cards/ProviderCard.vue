<script setup lang="ts">
  defineProps<{
    href: string
    newTab?: boolean
    testId: string
    title: string
    to?: string
    variant?: NonNullable<'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'>
  }>()
</script>

<template>
  <v-card
    :data-testid="testId || 'provider-card'"
    :href="href"
    :rel="newTab ? 'noreferrer' : ''"
    :target="newTab ? '_blank' : '_self'"
    :title="title"
    :to="to"
    :variant="variant"
  >
    <template #prepend>
      <!-- this slot is a placeholder for the provider image -->
      <v-icon icon="mdi-home"></v-icon>
    </template>
    <template #append>
      <v-icon
        @click.prevent
        icon="mdi-heart-outline"
      ></v-icon>
    </template>
  </v-card>
</template>

<style>
  .v-card .v-card-title {
    text-wrap: pretty;
  }
</style>
