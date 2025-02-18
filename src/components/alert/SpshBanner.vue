<script setup lang="ts">
  import { ref, type Ref } from 'vue';

  defineProps<{
    id: string;
    visible: boolean;
    text: string;
    type: 'errorLight' | 'warning';
  }>();

  type Emits = {
    (event: 'dismissBanner', value: string): void;
  };
  const emit: Emits = defineEmits<{
    (event: 'dismissBanner', value: string): void;
  }>();

  const showBanner: Ref<boolean> = ref(true);

  const dismissBanner = (id: string): void => {
    showBanner.value = false;
    emit('dismissBanner', id);
  };
</script>
<template>
  <v-alert
    :data-testid="id + '-banner'"
    class="mb-2"
    :model-value="visible"
    :color="type"
  >
    <v-row
      class="align-center"
      justify="space-between"
    >
      <v-col class="text-center mr-8 primary-text-color">
        <span class="text-body bold">{{ $t('banner.hint') }} </span>
        <span
          class="text-body"
          data-testid="alert-text"
          >{{ text }}</span
        >
        <slot name="text"></slot>
      </v-col>
      <v-col
        cols="auto"
        class="text-center primary-text-color"
      >
        <v-icon
          class="close-icon"
          data-testid="banner-close-icon"
          @click="dismissBanner(id)"
          icon="mdi-close"
        ></v-icon>
      </v-col>
    </v-row>
  </v-alert>
</template>
<style lang="css" scoped>
  .v-theme--shTheme {
    --v-theme-on-error: 0, 0, 0;
  }
  .close-icon {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }
</style>
