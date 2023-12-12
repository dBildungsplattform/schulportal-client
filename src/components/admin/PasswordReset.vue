<script setup lang="ts">
  import { ref, type Ref } from 'vue'
  import { type Composer, useI18n } from 'vue-i18n'

  const { t }: Composer = useI18n({ useScope: 'global' })

  type Person = {
    id: string
    name: {
      familienname: string
      vorname: string
    }
  }

  defineProps<{
    errorCode: string
    person: Person
    password: string
  }>()

  const passwordCopied: Ref<boolean> = ref(false)
  const showPassword: Ref<boolean> = ref(false)
  const errorMessage: Ref<string> = ref('')
  const copyToClipboardError: Ref<string> = ref('')
  const emit: (event: 'onClearPassword' | 'onResetPassword') => void = defineEmits([
    'onClearPassword',
    'onResetPassword'
  ])

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

  async function closeUserEditDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false
    showPassword.value = false
    emit('onClearPassword')
  }
</script>

<template>
  <v-dialog
    min-width="320px"
    persistent
    width="50%"
  >
    <template v-slot:activator="{ props }">
      <v-icon
        class="me-2"
        data-testid="open-password-reset-dialog-icon"
        icon="mdi-key-variant"
        size="small"
        v-bind="props"
      >
      </v-icon>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card class="pa-6">
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <i18n-t
                class="text-h5 text-center"
                data-testid="warning-header"
                keypath="admin.user.resetPasswordDialogHeader"
                scope="global"
                tag="p"
              >
                <template v-slot:firstname>
                  <b>{{ person.name.vorname }}</b>
                </template>
                <template v-slot:lastname>
                  <b>{{ person.name.familienname }}</b>
                </template>
              </i18n-t>
            </v-col>
          </v-row>
          <v-row
            v-if="errorMessage || errorCode"
            class="text-caption text-error"
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
          <v-row
              v-if="!errorMessage && !errorCode"
              class="text-caption text-error">
            <v-col
              class="text-right"
              cols="1"
            >
              <v-icon icon="mdi-alert"></v-icon>
            </v-col>
            <v-col>
              <p data-testid="warning-text">
                {{ $t('admin.user.resetPasswordDialogWarning') }}
              </p>
            </v-col>
          </v-row>
          <v-row>
            <v-col
              class="text-center"
              cols="12"
            >
              <v-btn
                @click.stop="$emit('onResetPassword', person.id)"
                class="primary"
                data-testid="password-reset-button"
                :disabled="!!password || !!errorMessage || !!errorCode"
                >{{ $t('admin.user.resetPassword') }}</v-btn
              >
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-if="password"
                append-icon="mdi-content-copy"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="copyToClipboard(password)"
                @click:appendInner="showPassword = !showPassword"
                data-testid="password-output-field"
                :hint="passwordCopied ? 'Passwort in Zwischenablage kopiert' : ''"
                :persistent-hint="passwordCopied"
                readonly
                :type="showPassword ? 'text' : 'password'"
                :value="password"
                :error-messages="copyToClipboardError"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn
            block
            @click.stop="closeUserEditDialog(isActive)"
            class="secondary"
            data-testid="close-user-edit-dialog-button"
            >{{ !!password ? $t('close') : $t('cancel') }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<style></style>
