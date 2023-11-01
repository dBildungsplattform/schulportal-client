<script setup lang="ts">
  import { ref } from 'vue'

  defineProps<{
    item?: any
    password?: string
  }>()

  const passwordCopied = ref(false)
  const showPassword = ref(false)
  const emit = defineEmits(['on-clear-password', 'on-copy-to-clipboard', 'on-reset-password'])

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        passwordCopied.value = true
      },
      (error) => {
        console.log(error)
      }
    )
  }

  async function closeUserEditDialog(isActive: any) {
    isActive.value = false
    showPassword.value = false
    emit('on-clear-password')
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
                  <b>{{ item.raw.person.name.vorname }}</b>
                </template>
                <template v-slot:lastname>
                  <b>{{ item.raw.person.name.familienname }}</b>
                </template>
              </i18n-t>
            </v-col>
          </v-row>
          <v-row class="text-caption text-error">
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
                @click.stop="$emit('on-reset-password', item.raw.person.id)"
                class="primary"
                data-testid="password-reset-button"
                :disabled="!!password"
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
