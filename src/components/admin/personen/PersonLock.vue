<script setup lang="ts">
  import { onBeforeMount, ref, type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from '@/stores/PersonenkontextStore';
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    errorCode: string;
    isLocked: boolean;
    person: Personendatensatz;
    adminId: string;
  };

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const schulen: Ref = ref<Array<{ value: string; title: string }>>([]);
  const selectedSchule: Ref = ref<string | null>(null);
  type Emits = (event: 'onLockUser', id: string, lock: boolean, schule: string) => void;

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const errorMessage: Ref<string> = ref('');
  const successMessage: Ref<string> = ref('');
  const isLockedTemp: Ref<boolean> = ref(!props.isLocked);

  async function closeLockPersonDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
    errorMessage.value = '';
    successMessage.value = '';
    isLockedTemp.value = !isLockedTemp.value;
  }
  async function handleOnLockUser(id: string): Promise<void> {
    try {
      await emit('onLockUser', id, isLockedTemp.value, selectedSchule.value);
      successMessage.value = isLockedTemp.value ? t('person.lockUserSuccess') : t('person.unlockUserSuccess');
    } catch (error) {
      errorMessage.value = props.isLocked ? t('person.lockUserError') : t('person.unlockUserError');
    }
  }

  function handleChangeSchule(value: string): void {
    selectedSchule.value = value;
  }

  onBeforeMount(async () => {
    await personenkontextStore.getPersonenuebersichtById(props.adminId);
    schulen.value =
      personenkontextStore.personenuebersicht?.zuordnungen.map((zuordnung: Zuordnung) => ({
        value: zuordnung.sskName,
        title: zuordnung.sskName,
      })) || [];
    if (schulen.value.length === 1) {
      selectedSchule.value = schulen.value[0];
    }
  });
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
          class="primary"
          data-testid="open-lock-dialog-icon"
          :block="mdAndDown"
          v-bind="props"
        >
          {{ isLockedTemp ? $t('person.lockUser') : $t('person.unlockUser') }}
        </v-btn>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="isLockedTemp ? $t('person.lockUser') : $t('person.unlockUser')"
        @onCloseClicked="closeLockPersonDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row
              v-if="errorMessage || props.errorCode"
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
                  {{ errorMessage || props.errorCode }}
                </p>
              </v-col>
            </v-row>
            <v-row
              v-if="isLockedTemp.valueOf() && !successMessage"
              class="justify-center w-full"
            >
              <v-col md="10">
                <FormRow
                  :errorLabel="() => 'ups'"
                  labelForId="schule-select"
                  :isRequired="true"
                  :label="$t('admin.schule.schule')"
                >
                  <v-select
                    clearable
                    :disabled="!(schulen.length > 1)"
                    data-testid="schule-select"
                    density="compact"
                    id="schule-select"
                    :items="schulen"
                    @update:modelValue="handleChangeSchule"
                    item-value="value"
                    item-text="title"
                    :no-data-text="$t('noDataFound')"
                    :placeholder="$t('admin.schule.assignSchule')"
                    ref="schule-select"
                    required="true"
                    variant="outlined"
                  ></v-select>
                </FormRow>
              </v-col>
            </v-row>
            <v-row class="text-body bold px-md-16">
              <v-col>
                <p
                  v-if="successMessage"
                  class="text-success"
                  data-testid="lock-user-info-text"
                >
                  {{ successMessage }}
                </p>
                <p
                  v-else
                  data-testid="lock-user-info-text"
                  class="text-body"
                >
                  {{ isLockedTemp ? $t('person.lockUserInfoText') : $t('person.unLockUserInfoText') }}
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
                @click.stop="closeLockPersonDialog(isActive)"
                data-testid="close-lock-user-dialog-button"
              >
                {{ !successMessage ? $t('cancel') : $t('close') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                v-if="!successMessage && isLockedTemp"
                :block="mdAndDown"
                class="primary button"
                :disabled="!selectedSchule"
                @click.stop="handleOnLockUser(props.person.person.id)"
                data-testid="lock-user-button"
              >
                {{ isLockedTemp ? $t('person.lockUser') : $t('person.unlockUser') }}
              </v-btn>

              <v-btn
                v-if="!successMessage && !isLockedTemp"
                :block="mdAndDown"
                class="primary button"
                @click.stop="handleOnLockUser(props.person.person.id)"
                data-testid="lock-user-button"
              >
                {{ isLockedTemp ? $t('person.lockUser') : $t('person.unlockUser') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>
