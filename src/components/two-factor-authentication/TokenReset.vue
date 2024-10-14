<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    TokenKind,
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import type { Personendatensatz } from '@/stores/PersonStore';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const isTokenResetRequested: Ref<boolean> = ref(false);
  const errorThrown: Ref<boolean> = ref(false);
  const twoFactorAuthenticationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
  const dialogText: Ref<string> = ref('');
  const dialogHeader: Ref<string> = ref(t('admin.person.twoFactorAuthentication.tokenReset'));

  type Emits = {
    (event: 'dialogClosed'): void;
  };

  const emits: Emits = defineEmits<{
    (event: 'dialogClosed'): void;
  }>();

  type Props = {
    errorCode: string;
    disabled: boolean;
    person: Personendatensatz;
    tokenType: TokenKind | null;
  };

  const props: Props = defineProps<Props>();
  async function closeTokenResetDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
    errorThrown.value = false;
    isTokenResetRequested.value = false;
    emits('dialogClosed');
  }

  function createDialogueText(): void {
    if (twoFactorAuthenticationStore.errorCode !== '') {
      const message: string = t(
        'admin.person.twoFactorAuthentication.errors.' + twoFactorAuthenticationStore.errorCode,
      );
      dialogText.value = message;
      dialogHeader.value =
        props.tokenType === TokenKind.hardware
          ? t('admin.person.twoFactorAuthentication.tokenResetHardwareErrorHeader')
          : t('admin.person.twoFactorAuthentication.tokenResetSoftwareErrorHeader');
    } else {
      dialogHeader.value = t('admin.person.twoFactorAuthentication.tokenReset');
      if (props.tokenType === TokenKind.hardware) {
        dialogText.value = t('admin.person.twoFactorAuthentication.tokenResetSuccessHardware');
      } else {
        dialogText.value = t('admin.person.twoFactorAuthentication.tokenResetSuccessSoftware');
      }
    }
  }

  async function tokenReset(): Promise<void> {
    try {
      await twoFactorAuthenticationStore.resetToken(props.person.person.id);
    } finally {
      createDialogueText();
      isTokenResetRequested.value = true;
      twoFactorAuthenticationStore.errorCode = '';
    }
  }
</script>
<template>
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <SpshTooltip
        :enabledCondition="!disabled"
        :disabledText="$t('person.finishEditFirst')"
        :enabledText="$t('admin.person.twoFactorAuthentication.tokenReset')"
        position="start"
      >
        <v-btn
          class="primary"
          data-testid="open-2FA-dialog-icon"
          :block="mdAndDown"
          :disabled="disabled"
          v-bind="props"
        >
          {{ t('admin.person.twoFactorAuthentication.tokenReset') }}
        </v-btn>
      </SpshTooltip>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="dialogHeader"
        @onCloseClicked="closeTokenResetDialog(isActive)"
      >
        <v-card-text>
          <v-container v-if="!isTokenResetRequested">
            <v-row class="text-body px-md-16">
              <v-col class="whiteSpace text-body bold">
                {{ $t('admin.person.twoFactorAuthentication.tokenResetDescription') }}
              </v-col>
            </v-row>
          </v-container>
          <v-container v-if="isTokenResetRequested">
            <v-row class="text-body px-md-16 bold">
              <v-col
                data-testid="dialog-text"
                class="whiteSpace"
              >
                {{ dialogText }}
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              v-if="!isTokenResetRequested"
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary button"
                @click.stop="closeTokenResetDialog(isActive)"
                data-testid="close-two-way-authentification-dialog-button"
              >
                {{ $t('cancel') }}
              </v-btn>
            </v-col>
            <v-col
              v-if="!isTokenResetRequested"
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                @click="tokenReset()"
                :block="mdAndDown"
                class="primary button"
                data-testid="two-way-authentification-set-up-button"
              >
                {{ $t('admin.person.twoFactorAuthentication.tokenResetButton') }}
              </v-btn>
            </v-col>
            <v-col
              v-if="isTokenResetRequested"
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                @click.stop="closeTokenResetDialog(isActive)"
                :block="mdAndDown"
                class="primary button"
                data-testid="two-way-authentification-set-up-button"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style scoped>
  .whiteSpace {
    white-space: pre-line;
  }
</style>
