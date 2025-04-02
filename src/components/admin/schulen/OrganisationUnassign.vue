<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import type { Zuordnung } from '@/stores/PersonenkontextStore';
  import { usePersonStore, type PersonStore, type PersonWithUebersicht } from '@/stores/PersonStore';
  import type { TranslatedObject } from '@/types';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { computed, type ComputedRef, onMounted, type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { object, string } from 'yup';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personStore: PersonStore = usePersonStore();

  const progress: Ref<number> = ref<number>(0);

  const formVisible: Ref<boolean> = ref<boolean>(true);
  const hasAutoselectedSchule: Ref<boolean> = ref(false);
  let organisationen: Ref<TranslatedObject[]> = ref([]);

  type Props = {
    errorCode: string;
    isLoading: boolean;
    selectedPersonenIds: string[];
  };

  type OrganisationUnassignForm = {
    selectedOrganisation: TranslatedObject | null;
  };

  const validationSchema = (): TypedSchema<OrganisationUnassignForm> => {
    return toTypedSchema(
      object({
        selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
      }),
    );
  };

  const getVuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  const formContext: FormContext<OrganisationUnassignForm, OrganisationUnassignForm> =
    useForm<OrganisationUnassignForm>({
      validationSchema,
    });

  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', getVuetifyConfig);

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  async function closeDialog(): Promise<void> {
    progress.value = 0;
    emit('update:isDialogVisible', false);
  }

  function clearSelectedOrganisation(): void {
    formContext.resetField('selectedOrganisation');
  }

  const canCommit: ComputedRef<boolean> = computed(
    () => selectedOrganisation.value !== undefined && personStore.loading === false,
  );

  onMounted(() => {
    let uniqueZuordnungnen: Zuordnung[] = [];
    const uniqueOrganisations: Map<string, TranslatedObject> = new Map<string, TranslatedObject>();

    personStore.personenWithUebersicht?.forEach((personWithUebersicht: PersonWithUebersicht) => {
      if (
        props.selectedPersonenIds.length > 0 &&
        personWithUebersicht?.personId &&
        !props.selectedPersonenIds.includes(personWithUebersicht.personId)
      ) {
        return;
      }
      personWithUebersicht?.zuordnungen.forEach((zuordnung: Zuordnung) => {
        if (
          zuordnung.editable &&
          zuordnung.typ == OrganisationsTyp.Schule &&
          !uniqueZuordnungnen.some((uniqueZuordnung: Zuordnung) => uniqueZuordnung.sskId == zuordnung.sskId)
        ) {
          uniqueZuordnungnen.push(zuordnung);
        }
      });
    });

    uniqueZuordnungnen.forEach((zuordnung: Zuordnung) => {
      uniqueOrganisations.set(zuordnung.sskId, {
        value: zuordnung.sskId,
        title: zuordnung.sskDstNr ? `${zuordnung.sskDstNr} (${zuordnung.sskName})` : zuordnung.sskName,
      });
    });

    if (uniqueOrganisations.size == 1 && uniqueZuordnungnen[0]?.sskId) {
      selectedOrganisation.value = uniqueOrganisations.get(uniqueZuordnungnen[0].sskId)?.value;
      hasAutoselectedSchule.value = true;
    }

    organisationen.value = Array.from(uniqueOrganisations.values());
  });
</script>

<template>
  <v-dialog
    v-model="formVisible"
    persistent
  >
    <LayoutCard
      data-testid="layout-card"
      :closable="false"
      :header="$t('person.removeZuordnung')"
      @onCloseClicked="closeDialog()"
    >
      <v-container>
        <v-form>
          <FormRow
            ref="form-row"
            errorLabel="test"
            :isRequired="true"
            labelForId="organisation-select"
            :label="$t('admin.organisation.organisation')"
          >
            <v-autocomplete
              class="mb-5"
              autocomplete="off"
              :class="[{ 'filter-dropdown mb-4': hasAutoselectedSchule }, { selected: selectedOrganisation }]"
              clearable
              :click:clear="clearSelectedOrganisation"
              data-testid="organisation-select"
              density="compact"
              :disabled="hasAutoselectedSchule"
              id="organisation-select"
              ref="organisation-select"
              hide-details
              :items="organisationen"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('admin.organisation.selectOrganisation')"
              required="true"
              variant="outlined"
              v-bind="selectedOrganisationProps"
              v-model="selectedOrganisation"
            ></v-autocomplete>
          </FormRow>
        </v-form>
      </v-container>

      <v-card-actions class="justify-center">
        <v-row
          v-if="progress === 0"
          class="py-3 px-2 justify-center"
        >
          <v-spacer class="hidden-sm-and-down"></v-spacer>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="secondary"
              @click="closeDialog"
              data-testid="org-unassign-discard-button"
              >{{ $t('cancel') }}</v-btn
            >
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              :disabled="!canCommit"
              class="primary"
              data-testid="org-unassign-submit-button"
              type="submit"
              >{{ $t('person.removeZuordnung') }}</v-btn
            >
          </v-col>
        </v-row>
        <v-row
          v-if="progress === 100"
          class="py-3 px-2 justify-center"
        >
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="primary"
              @click="closeDialog"
              data-testid="org-unassign-close-button"
            >
              {{ $t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style></style>
