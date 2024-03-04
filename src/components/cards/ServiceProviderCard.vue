<script setup lang="ts">
  defineProps<{
    href?: string;
    newTab?: boolean;
    testId: string;
    title: string;
    logoUrl?: string;
    to?: string;
    variant?: NonNullable<'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'>;
  }>();
</script>

<template>
  <v-card
    :data-testid="testId || 'service-provider-card'"
    :href="href ? href : ''"
    :rel="newTab ? 'noreferrer' : ''"
    :target="newTab ? '_blank' : '_self'"
    :title="title"
    :to="to"
    :variant="variant"
  >
    <template #prepend>
      <!-- this slot is a placeholder for the provider image -->
      <v-avatar
        color="grey"
        rounded="0"
        size="50"
      >
        <v-img :src="logoUrl"></v-img>
      </v-avatar>
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
    display: flex;
    justify-content: center; /* Center horizontally */
  }
</style>
