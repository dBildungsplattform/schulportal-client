<script setup lang="ts">
  import { computed, type ComputedRef, ref, type Ref } from 'vue';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import PasswordOutput from '@/components/form/PasswordOutput.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    errorCode: string;
    disabled: boolean;
    person: Personendatensatz;
    password: string;
    isLoading: boolean;
  };

  type Emits = {
    (event: 'onClearPassword'): void;
    (event: 'onResetPassword', id: string): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const errorMessage: Ref<string> = ref('');

  const resetPasswordInformationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = t('admin.person.resetPasswordInformation');
    if (!props.password) {
      message += `\n\n${t('admin.person.resetPasswordConfirmation', {
        firstname: props.person.person.name.vorname,
        lastname: props.person.person.name.familienname,
      })}`;
    }
    return message;
  });

  async function closePasswordResetDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
    emit('onClearPassword');
  }

  const printPassword = (): void => {
    const printWindow: WindowProxy | null = window.open(
      `${t('person.password')}`,
      `${t('person.password')}`,
      'height=700, width=900',
    );
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="de">
          <head>
            <title>${t('person.password')}</title>
            <style nonce="${cspNonce}">
              @media print {
                @page {
                  size: auto;
                  margin: 0mm;
                }
                body {
                  margin: 0;
                }
              }
              p { 
                font-size: 30px;
                text-align: center;
                line-height: 300px;
              }
            </style>
          </head>
          <body>
              <p>${props.password}</p>
          </body>
          </html>
      `);
      printWindow.document.close();
      printWindow.onafterprint = (): void => {
        printWindow.close();
      };
      printWindow.print();
      if (navigator.userAgent.includes('Firefox')) {
        // Since Firefox does not seem to pick up "onafterprint" event
        printWindow.close();
      }
    }
  };
</script>

<template>
  <v-dialog
    persistent
    ref="password-reset-dialog"
  >
    <template v-slot:activator="{ props }">
      <v-col
        cols="12"
        sm="6"
        md="auto"
      >
        <SpshTooltip
          :enabledCondition="!disabled"
          :disabledText="$t('person.finishEditFirst')"
          :enabledText="$t('admin.person.changePassword')"
          position="start"
        >
          <v-btn
            class="primary"
            data-testid="open-password-reset-dialog-icon"
            :block="mdAndDown"
            :disabled="disabled"
            v-bind="props"
          >
            {{ $t('admin.person.changePassword') }}
          </v-btn>
        </SpshTooltip>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="$t('admin.person.resetPassword')"
        @onCloseClicked="closePasswordResetDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row
              v-if="errorMessage || errorCode"
              class="text-body text-error"
            >
              <v-col
                class="text-right"
                cols="1"
              >
                <v-icon icon="mdi-alert"></v-icon>
              </v-col>
              <v-col>
                <p data-testid="error-text">
                  {{ errorMessage || errorCode }}
                </p>
              </v-col>
            </v-row>
            <v-row class="text-body bold px-md-16">
              <v-col>
                <p data-testid="password-reset-info-text">
                  {{ resetPasswordInformationMessage }}
                </p>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <PasswordOutput :password="password"></PasswordOutput>
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
                v-if="!!password"
                :block="mdAndDown"
                class="secondary button"
                @click="printPassword"
                data-testid="password-print-button"
              >
                {{ $t('admin.person.printPassword') }}
              </v-btn>
              <v-btn
                v-else
                :block="mdAndDown"
                class="primary button"
                @click.stop="$emit('onResetPassword', person.person.id)"
                data-testid="password-reset-button"
                :disabled="!!password || isLoading"
              >
                {{ $t('admin.person.resetPassword') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                v-if="!!password"
                :block="mdAndDown"
                class="primary button"
                @click.stop="closePasswordResetDialog(isActive)"
                data-testid="close-password-reset-dialog-button"
              >
                {{ $t('close') }}
              </v-btn>
              <v-btn
                v-else
                :block="mdAndDown"
                class="secondary button"
                @click.stop="closePasswordResetDialog(isActive)"
                data-testid="close-password-reset-dialog-button"
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

<style></style>
