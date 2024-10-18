<script setup lang="ts">
  import FormRow from '@/components/form/FormRow.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useRouter, type Router } from 'vue-router';
  import { useSchulen } from '@/composables/useSchulen';
  import { onMounted, ref, type ComputedRef, type Ref } from 'vue';
  import type { TranslatedObject } from '@/types';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { toTypedSchema } from '@vee-validate/yup';
  import { object, string } from 'yup';
  import { useI18n, type Composer } from 'vue-i18n';
  import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const schulen: ComputedRef<TranslatedObject[] | undefined> = useSchulen();
  const searchInputSchule: Ref<string> = ref('');
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSchule: string().required(t('admin.organisation.rules.organisation.required')),
    }),
  );

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  type PersonImportForm = {
    selectedOrganisation: string;
  };

  const formContext: FormContext<PersonImportForm, PersonImportForm> = useForm<PersonImportForm>({
    validationSchema,
  });

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);

  function clearSelectedSchule(): void {
    selectedSchule.value = undefined;
  }

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
  }

  onMounted(async () => {
    await organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule, limit: 30 });
    organisationStore.errorCode = '';
  });
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="true"
      data-testid="person-import-card"
      :header="$t('admin.person.import')"
      @onCloseClicked="navigateToPersonTable"
      :padded="true"
      :showCloseText="true"
    >
      <v-container class="px-3 px-sm-16">
        <v-container class="px-lg-16">
          <FormRow
            :errorLabel="selectedSchuleProps['error']"
            :isRequired="true"
            labelForId="schule-select"
            :label="$t('admin.schule.schule')"
          >
            <v-autocomplete
              class="mb-5"
              autocomplete="off"
              :class="[{ 'filter-dropdown mb-4': hasAutoselectedSchule }, { selected: selectedSchule }]"
              clearable
              :click:clear="clearSelectedSchule"
              data-testid="schule-select"
              density="compact"
              :disabled="hasAutoselectedSchule"
              id="schule-select"
              ref="schule-select"
              hide-details
              :items="schulen"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('admin.schule.selectSchule')"
              required="true"
              variant="outlined"
              v-bind="selectedSchuleProps"
              v-model="selectedSchule"
              v-model:search="searchInputSchule"
            ></v-autocomplete>
          </FormRow>
        </v-container>
      </v-container>
    </LayoutCard>
  </div>
</template>
