<script setup lang="ts">
  import { defineEmits, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Emits = {
    (event: 'updateHeader', header: string): void;
    (event: 'onCloseClicked'): void;
  };

  const emits: Emits = defineEmits<{
    (event: 'updateHeader', header: string): void;
    (event: 'onCloseClicked'): void;
  }>();

  const { t }: Composer = useI18n({ useScope: 'global' });

  type Props = {
    qrCodeImageBase64: string;
  };

  defineProps<Props>();

  let workflowStep: number = 0;

  emits('updateHeader', t('admin.person.twoFactorAuthentication.softwareTokenOption'));

  const printPage = (): void => {
    window.print();
  };
</script>

<template>
  <v-card-text v-if="workflowStep == 0">
    <v-container>
      <v-row>
        <p class="text-body">
          {{ $t('admin.person.twoFactorAuthentication.scanOrPrint') }}
        </p>
      </v-row>
      <v-row class="justify-center">
        <v-img
          class="printableContent image-width"
          :src="qrCodeImageBase64"
          max-width="250"
        />
      </v-row>
    </v-container>
  </v-card-text>
  <v-card-actions class="justify-center">
    <v-row class="justify-center">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-btn
          class="primary button"
          data-testid="close-two-way-authentification-dialog-button"
          :block="mdAndDown"
          @click="printPage"
        >
          {{ $t('print') }}
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-btn
          class="primary button"
          data-testid="two-way-authentification-set-up-button"
          :block="mdAndDown"
          @click="$emit('onCloseClicked')"
        >
          {{ $t('close') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-card-actions>
</template>
<style>
  @media print {
    body * {
      visibility: hidden;
    }
    .printableContent,
    .printableContent * {
      visibility: visible;
    }
    .printableContent {
      position: absolute;
      left: 0;
      top: 0;
    }
    .image-width {
      width: 250px;
    }
  }
</style>
