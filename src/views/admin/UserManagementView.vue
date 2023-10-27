<script setup lang="ts">
  import { useAuthStore } from '@/stores/AuthStore'
  import { usePersonStore } from '@/stores/PersonStore'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  const personStore = usePersonStore()
  const authStore = useAuthStore()
  personStore.getAllPersons()

  /* this block is necessary to match data table header types to shut up typescript */
  import type { VDataTable } from 'vuetify/lib/labs/components.mjs'
  type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>>
    ? UnwrapReadonlyArrayType<I>
    : A
  type DT = InstanceType<typeof VDataTable>
  type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<DT['headers']>

  const { t } = useI18n({ useScope: 'global' })
  const headers = [
    { title: t('user.name'), key: 'person.name', align: 'start' },
    { title: t('action'), key: 'actions', sortable: false }
  ] as ReadonlyDataTableHeader[]
  const itemsPerPage = 25 as number

  const showPassword = ref(false)
  const passwordCopied = ref(false)
  const password = ref('')

  async function closeUserEditDialog(isActive: any) {
    isActive.value = false
    showPassword.value = false
    password.value = ''
  }

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

  async function resetPassword(userId: string) {
    password.value = await authStore.resetPassword(userId)
  }
</script>

<template>
  <div class="admin">
    <h2>{{ $t('admin.user.management') }}</h2>
    <v-data-table
      class="elevation-1"
      data-testid="user-table"
      :headers="headers"
      :items="personStore.allPersons"
      v-model:items-per-page="itemsPerPage"
    >
      <template #[`item.person.name`]="{ item }"
        >{{ item.raw.person.name.vorname }} {{ item.raw.person.name.familienname }}</template
      >
      <template #[`item.actions`]="{ item }">
        <v-dialog
          min-width="320px"
          persistent
          width="50%"
        >
          <template v-slot:activator="{ props }">
            <v-icon
              class="me-2"
              data-testid="user-actions-icon"
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
                      @click.stop="resetPassword(item.raw.person.id)"
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
                      v-model="password"
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
    </v-data-table>
  </div>
</template>

<style></style>
