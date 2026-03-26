<script setup lang="ts">
  import { type Ref } from 'vue';
  import { useDisplay } from 'vuetify';

  defineProps<{
    successMessage: string;
    followingDataChanged: string;
    changedData: Array<{ label: string; value: string; testId: string }>;

    showBackButton: boolean;
    showCreateAnotherButton: boolean;

    backButtonText: string;
    createAnotherButtonText: string;

    backButtonTestId: string;
    createAnotherButtonTestId: string;
  }>();

  type Emits = {
    (event: 'back'): void;
    (event: 'createAnother'): void;
  };

  const emit: Emits = defineEmits<Emits>();

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const navigateBack = (): void => emit('back');
  const createAnother = (): void => emit('createAnother');
</script>

<template>
  <v-container>
    <!-- Success Message -->
    <v-row justify="center">
      <v-col
        cols="auto"
        class="subtitle-1"
      >
        {{ successMessage }}
      </v-col>
    </v-row>

    <!-- Icon -->
    <v-row justify="center">
      <v-col cols="auto">
        <v-icon
          color="success"
          icon="mdi-check-circle"
        />
      </v-col>
    </v-row>

    <!-- Subtitle -->
    <v-row justify="center">
      <v-col
        cols="auto"
        class="subtitle-2"
      >
        {{ followingDataChanged }}
      </v-col>
    </v-row>

    <!-- Data -->
    <v-row
      v-for="(item, index) in changedData"
      :key="index"
    >
      <v-col class="text-right font-weight-bold"> {{ item.label }}: </v-col>
      <v-col class="text-body">
        <span :data-testid="item.testId">{{ item.value }}</span>
      </v-col>
    </v-row>

    <v-divider class="my-6" />

    <!-- Actions -->
    <v-row justify="end">
      <v-col
        v-if="showBackButton"
        cols="12"
        sm="6"
        md="auto"
      >
        <v-btn
          class="secondary"
          :block="mdAndDown"
          :data-testid="backButtonTestId"
          @click="navigateBack"
        >
          {{ backButtonText }}
        </v-btn>
      </v-col>

      <v-col
        v-if="showCreateAnotherButton"
        cols="12"
        sm="6"
        md="auto"
      >
        <v-btn
          class="primary"
          :block="mdAndDown"
          :data-testid="createAnotherButtonTestId"
          @click="createAnother"
        >
          {{ createAnotherButtonText }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
