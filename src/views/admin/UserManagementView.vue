<script setup lang="ts">
  import { usePersonStore } from '@/stores/PersonStore'
  import { useI18n } from 'vue-i18n'

  const personStore = usePersonStore()
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
  const itemsPerPage = 25
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
          persistent
          width="500"
        >
          <template v-slot:activator="{ props }">
            <v-icon
              class="me-2"
              data-testid="user-actions-icon"
              size="small"
              v-bind="props"
            >
              mdi-pencil
            </v-icon>
          </template>

          <template v-slot:default="{ isActive }">
            <v-card>
              <v-card-text>
                {{ item }}
              </v-card-text>
              <v-card-actions>
                <v-btn
                  block
                  @click.stop="isActive.value = false"
                  color="primary"
                  data-testid="close-user-edit-dialog-button"
                  >{{ $t('close') }}</v-btn
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
