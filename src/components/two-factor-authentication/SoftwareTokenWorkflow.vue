<script setup lang="ts">
  import {
    type TwoFactorAuthentificationStore,
    useTwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import { computed, defineEmits, onMounted, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const twoFactorStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();

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

  const twoFactorAuthError: ComputedRef<string> = computed(() => {
    if (twoFactorStore.errorCode === 'SOFTWARE_TOKEN_INITIALIZATION_ERROR') {
      return t('admin.person.twoFactorAuthentication.errors.softwareTokenInitError');
    }
    // Default return, no error
    return '';
  });

  onMounted(() => {
    emits('updateHeader', t('admin.person.twoFactorAuthentication.softwareTokenOption'));
  });

  const printPage = (): void => {
    window.print();
  };
</script>

<template>
  <v-card-text>
    <v-container v-if="!twoFactorStore.errorCode">
      <v-row>
        <p
          class="text-body"
          data-testid="software-token-dialog-text"
        >
          {{ $t('admin.person.twoFactorAuthentication.scanOrPrint') }}
        </p>
      </v-row>
      <v-row class="justify-center">
        <v-img
          class="printable-content image-width"
          :src="qrCodeImageBase64"
          max-width="250"
          data-testid="software-token-dialog-qr-code"
        />
      </v-row>
    </v-container>
    <v-container v-else>
      <v-row>
        <p
          class="text-body bold"
          data-testid="software-token-dialog-error-text"
        >
          {{ twoFactorAuthError }}
          <a
            :href="t('admin.person.twoFactorAuthentication.errors.iqshHelpdeskLink')"
            rel="noopener noreferrer"
            target="_blank"
            >{{ $t('admin.person.twoFactorAuthentication.errors.iqshHelpdesk') }}</a
          >
          .
        </p>
      </v-row>
    </v-container>
  </v-card-text>
  <v-card-actions class="justify-center">
    <v-row class="justify-center">
      <v-col
        cols="12"
        sm="6"
        md="4"
        v-if="!twoFactorStore.errorCode"
      >
        <v-btn
          class="primary button"
          data-testid="print-software-token-dialog-button"
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
          data-testid="close-software-token-dialog-button"
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
    .printable-content,
    .printable-content * {
      visibility: visible;
    }
    .printable-content {
      position: absolute;
      left: 0;
      top: 0;
    }
    .image-width {
      width: 250px;
    }
  }
</style>
