<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import type { Personendatensatz } from '@/stores/PersonStore';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const proceeded: Ref<boolean> = ref(false);
  const isTokenResetSuccessful: Ref<boolean> = ref(false);
  const twoFactorAuthenticationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();

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
    tokenType: string | null;
  };

  const props: Props = defineProps<Props>();
  async function closeTokenResetDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
    isTokenResetSuccessful.value = false;
    proceeded.value = false;
    emits('dialogClosed');
  }

  async function tokenReset(): Promise<void> {
    try {
      await twoFactorAuthenticationStore.resetToken(props.person.person.id);
      isTokenResetSuccessful.value = true;
    } finally {
      proceeded.value = true;
    }
  }

  type DialogContent = {
    header: string;
    text: string;
  };

  const defaultContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentication.tokenReset'),
    text: '',
  };
  const errorHardwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentication.tokenResetHardwareErrorHeader'),
    text: t('admin.person.twoFactorAuthentication.tokenResetError'),
  };

  const errorSoftwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentication.tokenResetSoftwareErrorHeader'),
    text: t('admin.person.twoFactorAuthentication.tokenResetError'),
  };

  const tokenResetSoftwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentication.tokenReset'),
    text: t('admin.person.twoFactorAuthentication.tokenResetSuccessSoftware'),
  };

  const tokenResetHardwareContent: DialogContent = {
    header: t('admin.person.twoFactorAuthentication.tokenReset'),
    text: t('admin.person.twoFactorAuthentication.tokenResetSuccessHardware'),
  };

  const createDialogueText: () => DialogContent = () => {
    if (proceeded.value) {
      if (!isTokenResetSuccessful.value && props.tokenType === 'hardware') {
        return errorHardwareContent;
      } else if (!isTokenResetSuccessful.value && props.tokenType === 'software') {
        return errorSoftwareContent;
      } else if (props.tokenType === 'software') {
        return tokenResetSoftwareContent;
      } else if (props.tokenType === 'hardware') {
        return tokenResetHardwareContent;
      }
    }
    return defaultContent;
  };
</script>
<template>
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <v-col
        cols="12"
        sm="6"
        md="auto"
      >
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
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="createDialogueText().header"
        @onCloseClicked="closeTokenResetDialog(isActive)"
      >
        <v-card-text>
          <v-container v-if="!proceeded">
            <v-row class="text-body px-md-16">
              <v-col class="whiteSpace">
                {{ $t('admin.person.twoFactorAuthentication.tokenResetDescription') }}
              </v-col>
            </v-row>
          </v-container>
          <v-container v-if="proceeded">
            <v-row class="text-body px-md-16">
              <v-col class="whiteSpace">
                {{ createDialogueText().text }}
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              v-if="!proceeded"
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
              v-if="!proceeded"
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
              v-if="proceeded"
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

<style>
  .whiteSpace {
    white-space: pre-line;
  }
</style>
