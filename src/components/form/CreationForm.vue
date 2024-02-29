<script setup lang="ts">
  import { computed, type Ref, type WritableComputedRef } from 'vue'
  import { useDisplay } from 'vuetify'
  import LayoutCard from '../cards/LayoutCard.vue'

  type Props = {
    confirmUnsavedChangesAction: () => void
    createButtonLabel: string
    discardButtonLabel: string
    id: string
    onDiscard: () => void
    onSubmit: () => void
    showUnsavedChangesDialog?: boolean
  }

  const props: Props = defineProps<Props>()

  const emit: (event: 'onShowDialogChange', ...args: unknown[]) => void = defineEmits([
    'onShowDialogChange'
  ])

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()

  const showDialogValue: WritableComputedRef<boolean | undefined> = computed({
    get() {
      return props.showUnsavedChangesDialog
    },
    set(newValue: boolean | undefined) {
      emit('onShowDialogChange', newValue)
    }
  })
</script>

<template>
  <v-form
    :data-testid="id"
    @submit.prevent="onSubmit"
  >
    <v-container class="px-3 px-sm-16">
      <v-row class="align-center flex-nowrap mx-auto py-6">
        <v-icon
          aria-hidden="true"
          class="mr-2"
          icon="mdi-alert-circle-outline"
          size="small"
        ></v-icon>
        <label class="subtitle-2">{{ $t('admin.mandatoryFieldsNotice') }}</label>
      </v-row>
      <v-container class="px-lg-16">
        <slot />
      </v-container>
    </v-container>
    <v-divider
      class="border-opacity-100 rounded"
      color="#E5EAEF"
      thickness="5px"
    ></v-divider>
    <v-row class="py-3 px-2 justify-center">
      <v-spacer class="hidden-sm-and-down"></v-spacer>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-btn
          :block="smAndDown"
          class="secondary"
          @click.stop="onDiscard"
          :data-testid="`${id}-discard-button`"
          >{{ discardButtonLabel }}</v-btn
        >
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-btn
          :block="smAndDown"
          class="primary"
          :data-testid="`${id}-create-button`"
          type="submit"
          >{{ createButtonLabel }}</v-btn
        >
      </v-col>
    </v-row>
  </v-form>

  <!-- Warning dialog for unsaved changes -->
  <v-dialog
    persistent
    v-model="showDialogValue"
  >
    <LayoutCard :header="$t('unsavedChanges.title')">
      <v-card-text>
        <v-container>
          <v-row class="text-body bold px-md-16">
            <v-col>
              <p data-testid="unsaved-changes-warning-text">
                {{ $t('unsavedChanges.message') }}
              </p>
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
              @click.stop="confirmUnsavedChangesAction"
              class="secondary button"
              data-testid="confirm-unsaved-changes-button"
              :block="smAndDown"
            >
              {{ $t('yes') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-btn
              @click.stop="showDialogValue = false"
              class="primary button"
              data-testid="close-unsaved-changes-dialog-button"
              :block="smAndDown"
            >
              {{ $t('no') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style></style>
