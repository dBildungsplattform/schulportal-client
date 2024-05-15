<script setup lang="ts">
  import { computed, type ComputedRef, ref, type Ref } from 'vue';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    errorCode: string;
    person: Personendatensatz;
  };

  const props: Props = defineProps<Props>();
  const errorMessage: Ref<string> = ref('');

  const deletePersonConfirmationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `\n\n${t('admin.person.deletePersonConfirmation', {
      firstname: props.person.person.name.vorname,
      lastname: props.person.person.name.familienname,
    })}`;
    return message;
  });

  async function closePersonDeleteDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
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
        <v-btn
          class="primary button"
          data-testid="open-person-delete-dialog-icon"
          v-bind="props"
          :block="mdAndDown"
        >
          {{ $t('admin.person.deletePerson') }}
        </v-btn>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="$t('admin.person.deletePerson')"
        @onCloseClicked="closePersonDeleteDialog(isActive)"
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
              <v-col
                offset="2"
                cols="10"
              >
                <p data-testid="person-delete-confirmation-text">
                  {{ deletePersonConfirmationMessage }}
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
                :block="mdAndDown"
                class="secondary button"
                @click.stop="closePersonDeleteDialog(isActive)"
                data-testid="close-password-reset-dialog-button"
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
                @click.stop="$emit('onResetPassword', person.person.id)"
                data-testid="person-delete-button"
              >
                {{ $t('admin.person.deletePerson') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
