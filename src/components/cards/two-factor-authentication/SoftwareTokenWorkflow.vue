<script setup lang="ts">
  import { defineEmits, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const emits = defineEmits(['updateHeader']);
  const { t }: Composer = useI18n({ useScope: 'global' });

  let workflowStep: number = 0;

  emits('updateHeader', t('admin.person.twoFactorAuthentication.softwareTokenOption'));

  const printPage = () => {
    window.print();
  };
</script>

<template>
  <v-card-text v-if="workflowStep == 0">
    <v-container>
      <v-row class="justify-center">
        <img
          class="printableContent"
          src="data:image/png;base64,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"
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
  }
</style>
