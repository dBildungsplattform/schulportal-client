<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import SoftwareTokenWorkflow from './SoftwareTokenWorkflow.vue';
  import HardwareTokenWorkflow from './HardwareTokenWorkflow.vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    TokenKind,
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';

  const selectedOption: Ref<TokenKind> = ref(TokenKind.software);
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const twoFactorAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
  const tokenIsRequested: Ref<boolean> = ref(false);
  const dialogHeader: Ref<string> = ref(t('admin.person.twoFactorAuthentication.setUpLong'));

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
  };

  const props: Props = defineProps<Props>();

  async function close2FADialog(isActive: Ref<boolean>): Promise<void> {
    if (tokenIsRequested.value) {
      emits('dialogClosed');
      twoFactorAuthentificationStore.qrCode = '';
      twoFactorAuthentificationStore.hasToken = null;
      twoFactorAuthentificationStore.tokenKind = null;
    }

    isActive.value = false;
    tokenIsRequested.value = false;
    selectedOption.value = TokenKind.software;
    dialogHeader.value = t('admin.person.twoFactorAuthentication.setUpLong');
  }

  async function requestSoftwareToken(): Promise<void> {
    if (selectedOption.value === TokenKind.software) {
      await twoFactorAuthentificationStore.get2FASoftwareQRCode(props.person.person.id);
    }
    tokenIsRequested.value = true;
  }

  async function handleHeaderUpdate(header: string): Promise<void> {
    dialogHeader.value = header;
  }
</script>

<template>
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <SpshTooltip
        :enabledCondition="!disabled"
        :disabledText="$t('person.finishEditFirst')"
        :enabledText="$t('admin.person.twoFactorAuthentication.setUpShort')"
        position="start"
      >
        <v-btn
          class="primary"
          data-testid="open-2FA-dialog-icon"
          :block="mdAndDown"
          :disabled="disabled"
          v-bind="props"
        >
          {{ $t('admin.person.twoFactorAuthentication.setUpShort') }}
        </v-btn>
      </SpshTooltip>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="dialogHeader"
        @onCloseClicked="close2FADialog(isActive)"
        data-testid="two-factor-authentication-dialog"
      >
        <v-card-text v-if="!tokenIsRequested">
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col>
                <v-radio-group v-model="selectedOption">
                  <v-radio
                    :label="$t('admin.person.twoFactorAuthentication.softwareTokenOption')"
                    data-testid="software-token-radio-button"
                    value="software"
                  ></v-radio>
                  <v-radio
                    :label="$t('admin.person.twoFactorAuthentication.hardwareTokenOption')"
                    data-testid="hardware-token-radio-button"
                    value="hardware"
                  ></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
            <v-row class="text-body px-md-13">
              <v-col
                class="text-right"
                cols="1"
              >
                <v-icon
                  class="mb-2"
                  icon="mdi-information"
                >
                </v-icon>
              </v-col>
              <div class="v-col">
                <p
                  class="text-body"
                  v-if="selectedOption === TokenKind.software"
                >
                  {{ $t('admin.person.twoFactorAuthentication.softwareTokenText') }}
                </p>
                <p
                  class="text-body"
                  v-if="selectedOption === TokenKind.hardware"
                >
                  {{ $t('admin.person.twoFactorAuthentication.hardwareTokenText') }}
                </p>
              </div>
            </v-row>
          </v-container>
        </v-card-text>
        <v-container v-if="tokenIsRequested">
          <SoftwareTokenWorkflow
            v-if="selectedOption === TokenKind.software"
            :qrCodeImageBase64="twoFactorAuthentificationStore.qrCode"
            @updateHeader="handleHeaderUpdate"
            @onCloseClicked="close2FADialog(isActive)"
            data-testid="software-token-workflow"
          ></SoftwareTokenWorkflow>
          <HardwareTokenWorkflow
            v-if="selectedOption === TokenKind.hardware"
            @updateHeader="handleHeaderUpdate"
            @onCloseClicked="close2FADialog(isActive)"
            :errorCode="props.errorCode"
            :person="props.person"
            data-testid="hardware-token-workflow"
          >
          </HardwareTokenWorkflow>
        </v-container>
        <v-card-actions
          class="justify-center"
          v-if="!tokenIsRequested"
        >
          <v-row class="justify-center">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary button"
                @click.stop="close2FADialog(isActive)"
                data-testid="close-two-factor-authentication-dialog-button"
              >
                {{ $t('cancel') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="primary button"
                @click.stop="requestSoftwareToken()"
                data-testid="proceed-two-factor-authentication-dialog-button"
              >
                {{ $t('proceed') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
