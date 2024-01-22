<script setup lang="ts">
  import { computed, type ComputedRef, ref, type Ref } from 'vue'
  import { type Personendatensatz } from '@/stores/PersonStore'
  import { type Composer, useI18n } from 'vue-i18n'
  import LayoutCard from '@/components/cards/LayoutCard.vue'

  const { t }: Composer = useI18n({ useScope: 'global' })

  type Props = {
    errorCode: string
    person: Personendatensatz
    password: string
  }

  type Emits = {
    (event: 'onClearPassword'): void
    (event: 'onResetPassword', id: string): void
  }

  const props: Props = defineProps<Props>()
  const emit: Emits = defineEmits<Emits>()

  const passwordCopied: Ref<boolean> = ref(false)
  const showPassword: Ref<boolean> = ref(false)
  const errorMessage: Ref<string> = ref('')
  const copyToClipboardError: Ref<string> = ref('')

  const resetPasswordInformationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return ''
    }
    let message: string = t('admin.user.resetPasswordInformation')
    if (!props.password) {
      message += `\n\n${t('admin.user.resetPasswordConfirmation', {
        firstname: props.person.person.name.vorname,
        lastname: props.person.person.name.familienname
      })}`
    }
    return message
  })

  function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        passwordCopied.value = true
        copyToClipboardError.value = ''
      },
      (error: unknown) => {
        // eslint-disable-next-line no-console
        console.log(error)
        copyToClipboardError.value = t('admin.user.copyPasswordError')
      }
    )
  }

  async function closePasswordResetDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false
    passwordCopied.value = false
    showPassword.value = false
    emit('onClearPassword')
  }
</script>

<template>
  <v-dialog
    min-width="320px"
    persistent
  >
    <template v-slot:activator="{ props }">
      <v-btn
        class="reset-button primary button"
        data-testid="open-password-reset-dialog-icon"
        v-bind="props"
      >
        {{ $t('admin.user.changePassword') }}
      </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="$t('admin.user.resetPassword')"
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
            <v-row class="text-body bold px-16">
              <v-col>
                <p data-testid="password-reset-info-text">
                  {{ resetPasswordInformationMessage }}
                </p>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-if="password"
                  data-testid="password-output-field"
                  :error-messages="copyToClipboardError"
                  :hint="passwordCopied ? $t('admin.user.copyPasswordSuccess') : ''"
                  :persistent-hint="passwordCopied"
                  readonly
                  :type="showPassword ? 'text' : 'password'"
                  :value="password"
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click.stop="showPassword = !showPassword"
                      data-testid="show-password-icon"
                      :icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    ></v-icon>
                  </template>
                  <template v-slot:append>
                    <v-icon
                      @click.stop="copyToClipboard(password)"
                      data-testid="copy-password-icon"
                      icon="mdi-content-copy"
                    ></v-icon>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn
            @click.stop="closePasswordResetDialog(isActive)"
            class="secondary button"
            data-testid="close-password-reset-dialog-button"
          >
            {{ !!password ? $t('close') : $t('cancel') }}
          </v-btn>
          <v-btn
            @click.stop="$emit('onResetPassword', person.person.id)"
            class="primary button"
            data-testid="password-reset-button"
            :disabled="!!password"
          >
            {{ $t('admin.user.resetPassword') }}
          </v-btn>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style>
  .reset-button {
    transition: transform 0.3s ease-in-out;
    transform-origin: left center;
  }
  .reset-button:hover {
    background-color: #325e91 !important; /* Change the color on hover */
  }

    @media (max-width: 600px) {
    .reset-button:hover {
      /* Hover state with horizontal shrink */
      transform: scaleX(0.95);
    }
  }

</style>
