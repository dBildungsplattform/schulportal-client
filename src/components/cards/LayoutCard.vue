<script setup lang="ts">
  defineProps<{
    closable?: boolean
    header: string
    padded?: boolean
    showCloseText?: boolean
  }>()
</script>

<template>
  <v-card class="layout-card pb-1">
    <v-row
      align="center"
      class="ml-md-3 ml-1"
    >
      <v-col cols="auto">
        <h2 class="text-left headline-2" data-testid="layout-card-headline">{{ header }}</h2>
      </v-col>
      <v-spacer v-if="closable"></v-spacer>
      <v-col
        cols="2"
        cols-md="auto"
        v-if="closable"
        class="text-right mr-md-3 mr-8"
      >
        <v-btn
          append-icon="mdi-close"
          @click.stop="$emit('onCloseClicked')"
          data-testid="close-layout-card"
          :ripple="false"
          variant="text"
        >
          <span
            v-if="showCloseText"
            class="hidden-sm-and-down"
          >
            {{ $t('close') }}
          </span>
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
