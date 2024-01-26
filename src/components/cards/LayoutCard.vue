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
        <h2 class="text-left headline-2">{{ header }}</h2>
      </v-col>
      <v-spacer v-if="closable"></v-spacer>
      <v-col
        cols="2"
        cols-md="auto"
        v-if="closable"
        class="text-right mr-6"
      >
        <v-btn
          v-if="showCloseText"
          append-icon="mdi-close"
          class="hidden-sm-and-down"
          @click.stop="$emit('onCloseClicked')"
          :ripple="false"
          variant="text"
        >
          {{ $t('close') }}
        </v-btn>
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
