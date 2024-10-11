<script setup lang="ts">
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type Zuordnung } from '@/stores/PersonenkontextStore';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import {
    useForm,
    type BaseFieldProps,
    type FormContext,
    type FormValidationResult,
    type TypedSchema,
  } from 'vee-validate';
  import { DDMMYYYY } from '@/utils/validation';
  import { notInPast } from '@/utils/validationPersonenkontext';
  import { toTypedSchema } from '@vee-validate/yup';
  import { object, string } from 'yup';
  import PersonLockInput from './PersonLockInput.vue';
  import { formatDateToISO } from '@/utils/date';
  import { type Organisation } from '@/stores/OrganisationStore';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import type { TranslatedObject } from '@/types';
  import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    errorCode: string;
    person: Personendatensatz;
    adminId: string;
    formatOrganisationName: (org: Organisation) => string;
    intersectingOrganisations: Set<Organisation>;
    disabled: boolean;
  };
  type PersonLockForm = {
    selectedBefristung: string;
  };
  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedBefristung: string()
        .required(t('admin.befristung.rules.required'))
        .matches(DDMMYYYY, t('admin.befristung.rules.format'))
        .test('notInPast', t('admin.befristung.rules.pastDateNotAllowed'), notInPast),
    }),
  );

  const formContext: FormContext<PersonLockForm, PersonLockForm> = useForm<PersonLockForm>({
    validationSchema,
  });

  const [selectedBefristung, selectedBefristungProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedBefristung', vuetifyConfig);

  const personStore: PersonStore = usePersonStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const schulen: Ref<Array<{ value: string; title: string }>> = ref([]);
  const selectedSchule: Ref<string | null> = ref(null);
  const isUnbefristet: Ref<boolean> = ref(true);
  type Emits = {
    (event: 'onLockUser', id: string, lock: boolean, schule: string, date: string | undefined): void;
  };
  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const organisations: Ref<Array<TranslatedObject>> = computed(() => {
    return [...props.intersectingOrganisations].map((organisation: Organisation) => {
      const organisationDisplayName: string = props.formatOrganisationName(organisation);
      return {
        value: organisationDisplayName,
        title: organisationDisplayName,
      };
    });
  });
  const selectedOrganisation: Ref<string | null> = ref(null);
  const errorMessage: ComputedRef<string> = computed(() => {
    if (!props.errorCode) return '';
    return !props.person.person.isLocked ? t('person.lockError') : t('person.unlockError');
  });
  const hasSingleSelection: ComputedRef<boolean> = computed(() => {
    return organisations.value.length <= 1;
  });
  const selectedOrganisationId: ComputedRef<string | null> = computed(() => {
    if (!selectedOrganisation.value) return null;
    const organisation: Organisation | undefined = Array.from(props.intersectingOrganisations).find(
      (org: Organisation) => props.formatOrganisationName(org) === selectedOrganisation.value,
    );
    return organisation ? organisation.id : null;
  });

  function resetBefristungFields(): void {
    isUnbefristet.value = true;
    formContext.resetField('selectedBefristung');
    selectedBefristungProps.value.error = false;
    selectedBefristungProps.value['error-messages'] = [];
  }

  function closeLockPersonDialog(isActive: Ref<boolean>): void {
    resetBefristungFields();
    isActive.value = false;
  }
  function handleOnLockUser(id: string, isActive: Ref<boolean>): void {
    if (!isUnbefristet.value) {
      let { valid }: FormValidationResult<PersonLockForm, PersonLockForm> = await formContext.validate();
      if (!valid) return;
    }
    const lockingOrgId: string | null | undefined = props.person.person.isLocked
      ? props.person.person.lockInfo?.lock_locked_from
      : selectedOrganisationId.value;
    if (!lockingOrgId) return;
    let dateISO: string | undefined = formatDateToISO(selectedBefristung.value);
    emit('onLockUser', props.person.person.id, !props.person.person.isLocked, lockingOrgId);
    closeLockPersonDialog(isActive);
  }

  function handleChangeOrganisation(value: string): void {
    selectedOrganisation.value = value;
  }
  const handleBefristungChange = (value: string | undefined): void => {
    selectedBefristung.value = value;
  };

  const selectedRadionButtonChange = (value: boolean): void => {
    isUnbefristet.value = value;
    if (isUnbefristet.value) {
      selectedBefristungProps.value.error = false;
      selectedBefristungProps.value['error-messages'] = [];
    }
  };

  watch(
    organisations,
    (newOrganisations: Array<TranslatedObject>) => {
      if (newOrganisations.length === 1) {
        selectedOrganisation.value = organisations.value[0]?.value ?? null;
      }
    },
    { immediate: true },
  );
</script>

<template v-if="organisations.length > 0">
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <v-col
        cols="12"
        sm="6"
        md="auto"
        class="pb-0"
      >
        <SpshTooltip
          :enabledCondition="!disabled"
          :disabledText="$t('person.finishEditFirst')"
          :enabledText="$t('person.lockUser')"
          position="start"
        >
          <v-btn
            class="primary"
            data-testid="open-lock-dialog-icon"
            :disabled="disabled"
            :block="mdAndDown"
            v-bind="props"
          >
            {{ !person.person.isLocked ? $t('person.lockUser') : $t('person.unlockUser') }}
          </v-btn>
        </SpshTooltip>
      </v-col>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        data-testid="person-lock-card"
        :closable="true"
        :header="!person.person.isLocked ? $t('person.lockUser') : $t('person.unlockUser')"
        @onCloseClicked="closeLockPersonDialog(isActive)"
      >
        <v-container>
          <v-card-text>
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
              class="align-center justify-center w-full"
            >
              <v-col
                cols="12"
                sm="6"
                md="2"
                class="text-sm-center text-body"
              >
                <label for="schule-select">{{ $t('person.lockedBy') + ':' }}</label>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="6"
              >
                <v-select
                  :clearable="!hasSingleSelection"
                  :disabled="hasSingleSelection"
                  :hide-details="hasSingleSelection"
                  :class="[
                    { 'filter-dropdown': hasSingleSelection },
                    { selected: selectedOrganisation },
                    { 'align-center': true },
                  ]"
                  data-testid="schule-select"
                  density="compact"
                  id="schule-select"
                  :items="organisations"
                  @update:modelValue="handleChangeOrganisation"
                  item-value="value"
                  item-text="title"
                  :no-data-text="$t('noDataFound')"
                  :placeholder="$t('person.lockedBy')"
                  ref="schule-select"
                  required="true"
                  variant="outlined"
                  v-model="selectedOrganisation"
                ></v-select>
              </v-col>
            </v-row>
            <v-row
              class="justify-center w-full"
              v-if="!props.person.person.isLocked"
            >
              <v-col
                class="text-body"
                cols="12"
                sm="6"
                md="2"
              >
                Dauer der Sperre
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="6"
                class="text-sm-center text-body"
              >
                <PersonLockInput
                  v-model:befristung="selectedBefristung"
                  v-bind:befristung-props="selectedBefristungProps"
                  :is-unbefristet="isUnbefristet"
                  @update:befristung="handleBefristungChange"
                  @handleSelectedRadioButtonChange="selectedRadionButtonChange"
                >
                </PersonLockInput>
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
                  {{ !selectedOrganisation ? $t('close') : $t('cancel') }}
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
                  :disabled="!props.person.person.isLocked && !selectedOrganisation"
                  @click.stop="handleOnLockUser(isActive)"
                  data-testid="lock-user-button"
                >
                  {{ !props.person.person.isLocked ? $t('person.lockUser') : $t('person.unlockUser') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-container>
      </LayoutCard>
    </template>
  </v-dialog>
</template>
