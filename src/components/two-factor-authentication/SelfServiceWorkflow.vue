<script setup lang="ts">
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import { useI18n, type Composer } from 'vue-i18n';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const personStore: PersonStore = usePersonStore();

  const workflowStep: Ref<'start' | 'qrcode' | 'verify'> = ref('start');
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
      personStore.twoFactorState.qrCode = '';
      personStore.twoFactorState.hasToken = null;
      personStore.twoFactorState.tokenKind = null;
    }

    isActive.value = false;
    workflowStep.value = 'start';
  }

  async function validateOTP(): Promise<boolean> {
    return personStore.verify2FAToken(props.personId, otp.value);
  }

  async function proceed(isActive: Ref<boolean>): Promise<void> {
    switch (workflowStep.value) {
      case 'start':
        workflowStep.value = 'qrcode';
        await personStore.get2FASoftwareQRCode(props.personId);
        break;
      case 'qrcode':
        workflowStep.value = 'verify';
        break;
      case 'verify':
        if (await validateOTP()) {
          close2FADialog(isActive);
        } else {
          otp.value = '';
          errorMessage.value = t('admin.person.twoFactorAuthentication.invalidOtp');
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
            data-testid="open-2FA-dialog-icon"
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
                <p class="text-body">
                  {{ $t('admin.person.twoFactorAuthentication.qrCodeInfo') }}
                </p>
              </div>
            </v-row>
            <v-row class="text-body px-md-16 mt-6">
              <v-col class="d-flex">
                <v-icon icon="mdi-information"> </v-icon>
                <span class="ml-4">
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
              v-if="personStore.twoFactorState.qrCode.length === 0"
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
              v-if="personStore.twoFactorState.qrCode.length > 0"
              class="justify-center"
            >
              <v-img
                class="printableContent image-width"
                :src="personStore.twoFactorState.qrCode"
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
                  <p class="justify-center">Einmal-Passwort</p>
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
