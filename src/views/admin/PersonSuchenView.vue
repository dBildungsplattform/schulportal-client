<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useForm, type BaseFieldProps, type TypedSchema, type FormContext } from 'vee-validate';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
import { useRouter, type Router } from 'vue-router';
import { type Composer, useI18n } from 'vue-i18n';

    const router: Router = useRouter();
      const { t }: Composer = useI18n({ useScope: 'global' });

  const personStore: PersonStore = usePersonStore();

  enum SearchType {
    KoPers = 'kopers',
    Email = 'email',
    Username = 'username',
    Name = 'name',
  }

  // Default selection is always KoPers
  const searchType: Ref<SearchType> = ref<SearchType>(SearchType.KoPers);

  // Minimal schema, only for structure (no validation rules needed)
  const schema: TypedSchema = toTypedSchema(
    object({
      selectedKopers: string(),
      selectedEmail: string(),
      selectedUsername: string(),
      selectedVorname: string(),
      selectedNachname: string(),
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

  type PersonSearchForm = {
    selectedKopers: string;
    selectedEmail: string;
    selectedUsername: string;
    selectedVorname: string;
    selectedNachname: string;
  };

  const formContext: FormContext<PersonSearchForm> = useForm({ validationSchema: schema });

  const [selectedKopers, selectedKopersProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);
  const [selectedEmail, selectedEmailProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);
  const [selectedUsername, selectedUsernameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);
  const [selectedVorname, selectedVornameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);
  const [selectedNachname, selectedNachnameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);

  // Submission logic
  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = formContext.handleSubmit(
    async (values: PersonSearchForm) => {
      switch (searchType.value) {
        case SearchType.KoPers:
          await personStore.getLandesbedienstetePerson({ personalnummer: values.selectedKopers });
          break;
        case SearchType.Email:
          await personStore.getLandesbedienstetePerson({ primaryEmailAddress: values.selectedEmail });
          break;
        case SearchType.Username:
          await personStore.getLandesbedienstetePerson({ username: values.selectedUsername });
          break;
        case SearchType.Name:
          await personStore.getLandesbedienstetePerson({
            vorname: values.selectedVorname,
            familienname: values.selectedNachname,
          });
          break;
      }
    },
  );

  async function navigateBackToPersonSearchForm(): Promise<void> {
    if (
      personStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET' ||
    ) {
      formContext.resetForm();
      await router.push({ name: 'create-person' }).then(() => {
        router.go(0);
      });
    } else {
      personStore.errorCode = '';
      await router.push({ name: 'create-person' });
    }
  }
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
      :closable="false"
      :header="$t('admin.person.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display for error messages from the personStore -->
      <SpshAlert
        :modelValue="!!personStore.errorCode"
            :title="t(`admin.person.title.${personStore.errorCode}`)"
        :type="'error'"
        :closable="false"
        :showButton="true"
        :buttonText="$t('admin.person.backToCreatePerson')"
        :buttonAction="navigateBackToPersonSearchForm"
            :text="t(`admin.person.errors.${personStore.errorCode}`)"
      />
    </LayoutCard>
  </div>
</template>
