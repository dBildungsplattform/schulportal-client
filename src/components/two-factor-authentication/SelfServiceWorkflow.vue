<script setup lang="ts">
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const twoFactorStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();

enum TwoFactorSteps {
  Start = 'start',
  QRCode = 'qrcode',
  Verify = 'verify',
}

const workflowStep: Ref<TwoFactorSteps> = ref(TwoFactorSteps.Start);
  const errorMessage: Ref<string> = ref('');
  const otp: Ref<string> = ref('');

  const dialogHeader: ComputedRef<string> = computed(() => {
    switch (workflowStep.value) {
      case 'start':
        return t('admin.person.twoFactorAuthentication.setUpLong');
      case 'qrcode':
        return t('admin.person.twoFactorAuthentication.softwareTokenOption');
      case 'verify':
        return t('admin.person.twoFactorAuthentication.header');
      default:
        return t('admin.person.twoFactorAuthentication.setUpLong');
    }
  });

  type Emits = {
    (event: 'dialogClosed'): void;
  };

  const emits: Emits = defineEmits<{
    (event: 'dialogClosed'): void;
  }>();

  type Props = {
    personId: string;
  };

  const props: Props = defineProps<Props>();

  async function close2FADialog(isActive: Ref<boolean>): Promise<void> {
    if (workflowStep.value !== 'start') {
      emits('dialogClosed');
      twoFactorStore.qrCode = '';
      twoFactorStore.hasToken = null;
      twoFactorStore.tokenKind = null;
    }

    isActive.value = false;
    workflowStep.value = 'start';
  }

  async function proceed(isActive: Ref<boolean>): Promise<void> {
    switch (workflowStep.value) {
      case 'start':
        workflowStep.value = 'qrcode';
        await twoFactorStore.get2FASoftwareQRCode(props.personId);
        break;
      case 'qrcode':
        workflowStep.value = 'verify';
        break;
      case 'verify':
        try {
          await twoFactorStore.verify2FAToken(props.personId, otp.value);
          close2FADialog(isActive);
        } catch (error) {
          otp.value = '';
          errorMessage.value = t(`admin.person.twoFactorAuthentication.errors.${twoFactorStore.errorCode}`);
        }
    }
  }
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
          :enabled-condition="true"
          :enabledText="$t('admin.person.twoFactorAuthentication.setUpShort')"
          position="start"
        >
          <v-btn
            class="primary"
            data-testid="open-2FA-self-service-dialog-icon"
            :block="mdAndDown"
            v-bind="props"
          >
            {{ $t('admin.person.twoFactorAuthentication.setUpShort') }}
          </v-btn>
        </SpshTooltip>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="dialogHeader"
        @onCloseClicked="close2FADialog(isActive)"
        data-testid="two-factor-authentication-dialog"
      >
        <v-card-text>
          <v-container v-if="workflowStep === 'start'">
            <v-row class="text-body px-md-16">
              <div class="v-col">
                <p
                  class="text-body"
                  data-testid="self-service-dialog-info-text"
                >
                  {{ $t('admin.person.twoFactorAuthentication.qrCodeInfo') }}
                </p>
              </div>
            </v-row>
            <v-row class="text-body px-md-16 mt-6">
              <v-col class="d-flex">
                <v-icon
                  icon="mdi-alert-circle"
                  color="orange"
                ></v-icon>
                <span
                  class="ml-4"
                  data-testid="self-service-dialog-warning-text"
                >
                  {{ $t('admin.person.twoFactorAuthentication.softwareOnDevice') }}
                </span>
              </v-col>
            </v-row>
          </v-container>
          <v-container v-if="workflowStep === 'qrcode'">
            <v-row class="text-body px-md-16">
              <div class="v-col">
                <p class="text-body">
                  {{ $t('admin.person.twoFactorAuthentication.pleaseScan') }}
                </p>
              </div>
            </v-row>
            <v-row
              v-if="twoFactorStore.qrCode.length === 0"
              class="justify-center"
            >
              <v-progress-circular
                size="250"
                width="250"
                indeterminate
              >
              </v-progress-circular>
            </v-row>
            <v-row
              v-if="twoFactorStore.qrCode.length > 0"
              class="justify-center"
            >
              <v-img
                class="printableContent image-width"
                :src="twoFactorStore.qrCode"
                max-width="250"
                data-testid="software-token-dialog-qr-code"
              />
            </v-row>
          </v-container>
          <v-container
            v-if="workflowStep === 'verify'"
            class="fill-height"
          >
            <v-row
              justify="center"
              class="fill-height"
            >
              <v-col
                cols="12"
                md="8"
              >
                <v-row class="text-body px-md-16 justify-center">
                  <v-col>
                    <p
                      data-testid="password-reset-info-text"
                      class="text-center"
                    >
                      {{ $t('admin.person.twoFactorAuthentication.enterOtp') }}
                    </p>
                  </v-col>
                </v-row>

                <v-row class="justify-center">
                  <v-otp-input
                    v-model="otp"
                    :error="errorMessage.length > 0"
                    @input="errorMessage = ''"
                  >
                  </v-otp-input>
                </v-row>

                <v-row
                  v-if="errorMessage.length > 0"
                  class="text-body justify-center text-error"
                >
                  <p class="justify-center">{{ errorMessage }}</p>
                </v-row>

                <v-row
                  v-if="errorMessage.length === 0"
                  class="text-body justify-center"
                >
                  <p class="justify-center">{{ $t('admin.person.twoFactorAuthentication.otp') }}</p>
                </v-row>
              </v-col>
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
                :block="mdAndDown"
                class="secondary button"
                @click.stop="close2FADialog(isActive)"
                data-testid="close-two-factor-authentication-dialog"
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
                @click.stop="proceed(isActive)"
                data-testid="proceed-two-factor-authentication-dialog"
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
