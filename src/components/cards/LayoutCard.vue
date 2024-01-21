<script setup lang="ts">
  defineProps<{
    closable?: boolean
    header: string
    padded?: boolean
    showCloseText?: boolean
  }>()
</script>

<template>
  <v-card class="layout-card">
    <v-row
      align="center"
      class="ml-md-6 ml-1 my-1"
    >
  
      <v-col cols="auto">
        <h2 class="text-left layout-card-headline">{{ header }}</h2>
      </v-col>
      <v-spacer v-if="closable"></v-spacer>
      <v-col
        v-if="closable"
        class="text-right mr-6"
      >
        <span
          v-if="showCloseText"
          class="pointer hidden-sm-and-down"
          @click.stop="$emit('onCloseClicked')"
          >{{ $t('close') }}</span
        >
        <v-icon
          @click.stop="$emit('onCloseClicked')"
          icon="mdi-close"
          size="x-large"
        ></v-icon>
      </v-col>
    </v-row>
    <v-divider
      class="border-opacity-100 rounded"
      color="#1EAE9C"
      thickness="5px"
    ></v-divider>
    <div>
      <slot />
    </div>
  </v-card>
</template>

<style></style>
