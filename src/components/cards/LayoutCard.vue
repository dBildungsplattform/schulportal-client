<script setup lang="ts">
  defineProps<{
    closable?: boolean;
    header: string;
    padded?: boolean;
    showCloseText?: boolean;
  }>();
</script>

<template>
  <v-card class="layout-card pb-1">
    <v-row
      align="center"
      class="flex-nowrap ml-md-6 ml-1"
    >
      <v-col cols="auto">
        <h2
          class="text-left headline-2"
          data-testid="layout-card-headline"
        >
          {{ header }}
        </h2>
      </v-col>
      <v-spacer v-if="closable"></v-spacer>
      <v-col
        cols="2"
        v-if="closable"
        class="text-right mr-md-3 mr-8"
      >
        <v-btn
          class="hidden-sm-and-down"
          @click.stop="$emit('onCloseClicked')"
          data-testid="close-layout-card-button"
          :ripple="false"
          variant="text"
        >
          <span v-if="showCloseText">
            {{ $t('close') }}
          </span>
          <template #append>
            <v-icon
              icon="mdi-close"
              size="x-large"
            ></v-icon>
          </template>
        </v-btn>
        <v-btn
          class="hidden-md-and-up"
          density="compact"
          icon
          variant="text"
        >
          <v-icon
            @click.stop="$emit('onCloseClicked')"
            icon="mdi-close"
            size="x-large"
          ></v-icon>
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
