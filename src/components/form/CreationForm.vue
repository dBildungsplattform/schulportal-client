<script setup lang="ts">
  import { type Ref } from 'vue'
  import { useDisplay } from 'vuetify'

  type Props = {
    createButtonLabel: string
    discardButtonLabel: string
    id: string
    onDiscard: () => void
    onSubmit: () => void
    resetForm: () => void
  }

  defineProps<Props>()

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()
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
</template>

<style></style>
