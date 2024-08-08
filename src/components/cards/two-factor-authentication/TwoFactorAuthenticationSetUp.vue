<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { usePersonStore, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import SoftwareTokenWorkflow from './SoftwareTokenWorkflow.vue';
  import { useI18n, type Composer } from 'vue-i18n';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const selectedOption: Ref<'software' | 'hardware'> = ref('software');
  const personStore: PersonStore = usePersonStore();

  let qrCodeImageBase64: string = '';

  const proceeded: Ref<boolean> = ref(false);

  const dialogHeader: Ref<string> = ref(t('admin.person.twoFactorAuthentication.setUpLong'));

  type Emits = {
    (event: 'dialogClosed'): void;
  };

  const emits: Emits = defineEmits<{
    (event: 'dialogClosed'): void;
  }>();

  type Props = {
    errorCode?: string;
    disabled?: boolean;
    person?: Personendatensatz;
  };

  const props: Props = defineProps<Props>();

  async function close2FADialog(isActive: Ref<boolean>): Promise<void> {
    if (proceeded.value) {
      emits('dialogClosed');
    }

    isActive.value = false;
    proceeded.value = false;
    selectedOption.value = 'software';
    dialogHeader.value = t('admin.person.twoFactorAuthentication.setUpLong');
  }

  async function proceed(): Promise<void> {
    qrCodeImageBase64 = await personStore.get2FASoftwareQRCode(props.person?.person.id ?? '', false);
    proceeded.value = true;
  }

  async function handleHeaderUpdate(header: string): Promise<void> {
    dialogHeader.value = header;
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
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="dialogHeader"
        @onCloseClicked="close2FADialog(isActive)"
        data-testid="two-factor-authentication-dialog"
      >
        <v-card-text v-if="!proceeded">
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col>
                <v-radio-group v-model="selectedOption">
                  <v-radio
                    :label="$t('admin.person.twoFactorAuthentication.softwareTokenOption')"
                    data-testid="software-token-option"
                    value="software"
                  ></v-radio>
                  <v-radio
                    :label="$t('admin.person.twoFactorAuthentication.hardwareTokenOption')"
                    data-testid="hardware-token-option"
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
                  v-if="selectedOption === 'software'"
                >
                  {{ $t('admin.person.twoFactorAuthentication.softwareTokenText') }}
                </p>
                <p
                  class="text-body"
                  v-if="selectedOption === 'hardware'"
                >
                  {{ $t('admin.person.twoFactorAuthentication.hardwareTokenText') }}
                </p>
              </div>
            </v-row>
          </v-container>
        </v-card-text>
        <v-container v-if="proceeded">
          <SoftwareTokenWorkflow
            v-if="selectedOption === 'software'"
            :qrCodeImageBase64="qrCodeImageBase64"
            @updateHeader="handleHeaderUpdate"
            @onCloseClicked="close2FADialog(isActive)"
            data-testid="software-token-workflow"
          ></SoftwareTokenWorkflow>
        </v-container>
        <v-card-actions
          class="justify-center"
          v-if="!proceeded"
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
                @click.stop="proceed()"
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
