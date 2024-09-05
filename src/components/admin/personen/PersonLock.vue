<script setup lang="ts">
  import { computed, onBeforeMount, ref, type ComputedRef, type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { type Personendatensatz, usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { useDisplay } from 'vuetify';
  import FormRow from '@/components/form/FormRow.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type Zuordnung } from '@/stores/PersonenkontextStore';
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    errorCode: string;
    person: Personendatensatz;
    adminId: string;
  };

  const personStore: PersonStore = usePersonStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const schulen: Ref<Array<{ value: string; title: string }>> = ref([]);
  const selectedSchule: Ref<string | null> = ref(null);
  type Emits = {
    (event: 'onLockUser', id: string, lock: boolean, schule: string): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const errorMessage: ComputedRef<string> = computed(() => {
    let errorCode: string = '';
    if (errorCode === '') errorCode = props.errorCode;
    if (errorCode === '') errorCode = personStore.errorCode;
    if (errorCode === '') errorCode = organisationStore.errorCode;
    if (!errorCode) return '';
    let message: string = t(`errors.${errorCode}`);
    if (message === '')
      message = !props.person.person.isLocked ? t('person.lockUserError') : t('person.unlockUserError');
    return message;
  });
  const hasSingleSelection: ComputedRef<boolean> = computed(() => {
    return schulen.value.length <= 1;
  });

  function closeLockPersonDialog(isActive: Ref<boolean>): void {
    isActive.value = false;
  }
  function handleOnLockUser(id: string, isActive: Ref<boolean>): void {
    if (selectedSchule.value) {
      emit('onLockUser', id, !props.person.person.isLocked, selectedSchule.value);
      closeLockPersonDialog(isActive);
    }
  }

  function handleChangeSchule(value: string): void {
    selectedSchule.value = value;
  }

  async function getAssignedOrganisationIds(id: string): Promise<Zuordnung['sskId'][]> {
    await personStore.getPersonenuebersichtById(id);
    return (personStore.personenuebersicht?.zuordnungen || []).map(({ sskId }: Zuordnung) => sskId);
  }

  async function getOrganisationIntersection(): Promise<Set<Organisation>> {
    const adminAssignedOrganisationIds: Zuordnung['sskId'][] = await getAssignedOrganisationIds(props.adminId);
    const userAssignedOrganisationIds: Zuordnung['sskId'][] = await getAssignedOrganisationIds(props.person.person.id);

    await organisationStore.getParentOrganisationsByIds(userAssignedOrganisationIds);
    const userParentOrganisationen: Organisation[] = organisationStore.parentOrganisationen;
    return new Set<Organisation>(
      userParentOrganisationen.filter((userOrg: Organisation) =>
        adminAssignedOrganisationIds.find((sskId: Zuordnung['sskId']) => userOrg.id === sskId),
      ),
    );
  }

  onBeforeMount(async () => {
    const intersectingOrganisations: Set<Organisation> = await getOrganisationIntersection();
    schulen.value = [...intersectingOrganisations].map((organisation: Organisation) => {
      const v: string = `${organisation.kennung ?? ''} (${organisation.name})`;
      return {
        value: v,
        title: v,
      };
    });
    if (schulen.value.length === 1) {
      selectedSchule.value = schulen.value[0]?.value ?? null;
    }
  });
</script>

<template v-if="schulen.length > 0">
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <v-col
        cols="12"
        sm="6"
        md="auto"
        class="pb-0"
      >
        <v-btn
          class="primary"
          data-testid="open-lock-dialog-icon"
          :block="mdAndDown"
          v-bind="props"
        >
          {{ !person.person.isLocked ? $t('person.lockUser') : $t('person.unlockUser') }}
        </v-btn>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :closable="true"
        :header="!person.person.isLocked ? $t('person.lockUser') : $t('person.unlockUser')"
        @onCloseClicked="closeLockPersonDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row
              v-if="errorMessage"
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
                  {{ errorMessage }}
                </p>
              </v-col>
            </v-row>
            <v-row
              v-if="!props.person.person.isLocked"
              class="justify-center w-full"
            >
              <v-col md="10">
                <FormRow
                  :errorLabel="() => 'ups'"
                  labelForId="schule-select"
                  :isRequired="true"
                  :label="$t('person.lockedBy')"
                >
                  <v-select
                    :clearable="!hasSingleSelection"
                    :disabled="hasSingleSelection"
                    :hide-details="hasSingleSelection"
                    :class="[{ 'filter-dropdown mb-4': hasSingleSelection }, { selected: selectedSchule }]"
                    data-testid="schule-select"
                    density="compact"
                    id="schule-select"
                    :items="schulen"
                    @update:modelValue="handleChangeSchule"
                    item-value="value"
                    item-text="title"
                    :no-data-text="$t('noDataFound')"
                    :placeholder="$t('person.lockedBy')"
                    ref="schule-select"
                    required="true"
                    variant="outlined"
                    v-model="selectedSchule"
                  ></v-select>
                </FormRow>
              </v-col>
            </v-row>
            <v-row class="text-body bold px-md-16">
              <v-col cols="1">
                <v-icon icon="mdi-information-slab-circle-outline"></v-icon>
              </v-col>
              <v-col cols="11">
                <span
                  data-testid="lock-user-info-text"
                  class="text-body"
                >
                  {{ !person.person.isLocked ? $t('person.lockUserInfoText') : $t('person.unLockUserInfoText') }}
                </span>
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
                data-testid="close-lock-person-dialog-button"
              >
                {{ !selectedSchule ? $t('close') : $t('cancel') }}
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
                :disabled="!selectedSchule"
                @click.stop="handleOnLockUser(props.person.person.id, isActive)"
                data-testid="lock-user-button"
              >
                {{ !props.person.person.isLocked ? $t('person.lockUser') : $t('person.unlockUser') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>
